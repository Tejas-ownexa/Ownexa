from flask import Blueprint, request, jsonify
from models.work_order import WorkOrder, WorkOrderPart, WorkOrderFile, Task, work_order_tasks
from models.vendor import Vendor
from models.property import Property
from models.user import User
from config import db
from routes.auth_routes import token_required
from datetime import datetime, date
from sqlalchemy import or_, and_

work_order_bp = Blueprint('work_order_bp', __name__)

# Work Order Routes
@work_order_bp.route('', methods=['GET'])
@token_required
def get_work_orders(current_user):
    """Get all work orders for current user"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get filter parameters
        property_id = request.args.get('property')
        statuses = request.args.getlist('status')
        priority = request.args.get('priority')
        vendor_id = request.args.get('vendor')
        search = request.args.get('search', '')
        
        # Build query - get work orders for properties owned by current user
        query = db.session.query(WorkOrder).join(Property).filter(
            or_(
                Property.owner_id == current_user.id,
                WorkOrder.created_by_user_id == current_user.id
            )
        )
        
        if property_id:
            query = query.filter(WorkOrder.property_id == property_id)
        
        if statuses:
            query = query.filter(WorkOrder.status.in_(statuses))
        
        if priority:
            query = query.filter(WorkOrder.priority == priority)
        
        if vendor_id:
            query = query.filter(WorkOrder.assigned_vendor_id == vendor_id)
        
        if search:
            search_filter = or_(
                WorkOrder.title.ilike(f'%{search}%'),
                WorkOrder.description.ilike(f'%{search}%'),
                WorkOrder.work_order_number.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        work_orders = query.order_by(WorkOrder.created_at.desc()).all()
        
        return jsonify([{
            'id': wo.id,
            'work_order_number': wo.work_order_number,
            'title': wo.title,
            'description': wo.description,
            'status': wo.status,
            'priority': wo.priority,
            'category': wo.category,
            'due_date': wo.due_date.isoformat() if wo.due_date else None,
            'bill_total': float(wo.bill_total) if wo.bill_total else None,
            'bill_status': wo.bill_status,
            'age_days': wo.get_age_days(),
            'property': {
                'id': wo.property.id,
                'title': wo.property.title,
                'address': f"{wo.property.street_address_1}, {wo.property.city}"
            } if wo.property else None,
            'assigned_vendor': {
                'id': wo.assigned_vendor.id,
                'display_name': wo.assigned_vendor.display_name
            } if wo.assigned_vendor else None,
            'assigned_to_user': {
                'id': wo.assigned_to_user.id,
                'full_name': wo.assigned_to_user.full_name
            } if wo.assigned_to_user else None,
            'created_at': wo.created_at.isoformat() if wo.created_at else None,
            'last_updated': wo.last_updated.isoformat() if wo.last_updated else None
        } for wo in work_orders]), 200
    except Exception as e:
        print(f"Error fetching work orders: {str(e)}")
        return jsonify({'error': str(e)}), 400

@work_order_bp.route('', methods=['POST'])
@token_required
def create_work_order(current_user):
    """Create a new work order"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'property_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify property ownership
        property_obj = Property.query.filter_by(
            id=data['property_id'],
            owner_id=current_user.id
        ).first()
        if not property_obj:
            return jsonify({'error': 'Property not found or access denied'}), 404
        
        # Create work order
        work_order = WorkOrder(
            property_id=data['property_id'],
            title=data['title'],
            description=data['description'],
            priority=data.get('priority', 'medium'),
            status=data.get('status', 'new'),
            category=data.get('category'),
            assigned_to_user_id=data.get('assigned_to_user_id'),
            assigned_vendor_id=data.get('assigned_vendor_id'),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
            estimated_cost=data.get('estimated_cost'),
            work_to_be_performed=data.get('work_to_be_performed'),
            vendor_notes=data.get('vendor_notes'),
            entry_details=data.get('entry_details'),
            entry_contact=data.get('entry_contact'),
            work_hours=data.get('work_hours'),
            charge_hours_to=data.get('charge_hours_to'),
            notes=data.get('notes'),
            created_by_user_id=current_user.id
        )
        
        db.session.add(work_order)
        db.session.flush()  # Get the ID
        
        # Add parts if provided
        if data.get('parts'):
            for i, part_data in enumerate(data['parts']):
                if part_data.get('description') or part_data.get('qty') or part_data.get('unit_price'):
                    part = WorkOrderPart(
                        work_order_id=work_order.id,
                        qty=int(part_data.get('qty', 0)) if part_data.get('qty') else 0,
                        account=part_data.get('account'),
                        description=part_data.get('description'),
                        unit_price=float(part_data.get('unit_price', 0)) if part_data.get('unit_price') else 0,
                        line_order=i
                    )
                    part.calculate_total()
                    db.session.add(part)
        
        # Link to existing task if specified
        if data.get('existing_task_id'):
            task = Task.query.get(data['existing_task_id'])
            if task:
                work_order.tasks.append(task)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Work order created successfully',
            'work_order': {
                'id': work_order.id,
                'work_order_number': work_order.work_order_number,
                'title': work_order.title,
                'status': work_order.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating work order: {str(e)}")
        return jsonify({'error': str(e)}), 400

@work_order_bp.route('/<int:work_order_id>', methods=['GET'])
@token_required
def get_work_order(current_user, work_order_id):
    """Get a specific work order"""
    try:
        # Get work order and verify access
        work_order = db.session.query(WorkOrder).join(Property).filter(
            WorkOrder.id == work_order_id,
            or_(
                Property.owner_id == current_user.id,
                WorkOrder.created_by_user_id == current_user.id
            )
        ).first_or_404()
        
        return jsonify({
            'id': work_order.id,
            'work_order_number': work_order.work_order_number,
            'title': work_order.title,
            'description': work_order.description,
            'status': work_order.status,
            'priority': work_order.priority,
            'category': work_order.category,
            'property_id': work_order.property_id,
            'assigned_to_user_id': work_order.assigned_to_user_id,
            'assigned_vendor_id': work_order.assigned_vendor_id,
            'due_date': work_order.due_date.isoformat() if work_order.due_date else None,
            'estimated_cost': float(work_order.estimated_cost) if work_order.estimated_cost else None,
            'actual_cost': float(work_order.actual_cost) if work_order.actual_cost else None,
            'bill_total': float(work_order.bill_total) if work_order.bill_total else None,
            'bill_status': work_order.bill_status,
            'work_to_be_performed': work_order.work_to_be_performed,
            'vendor_notes': work_order.vendor_notes,
            'entry_details': work_order.entry_details,
            'entry_contact': work_order.entry_contact,
            'work_hours': float(work_order.work_hours) if work_order.work_hours else None,
            'charge_hours_to': work_order.charge_hours_to,
            'notes': work_order.notes,
            'age_days': work_order.get_age_days(),
            'property': {
                'id': work_order.property.id,
                'title': work_order.property.title,
                'address': f"{work_order.property.street_address_1}, {work_order.property.city}"
            } if work_order.property else None,
            'assigned_vendor': {
                'id': work_order.assigned_vendor.id,
                'display_name': work_order.assigned_vendor.display_name,
                'primary_email': work_order.assigned_vendor.primary_email,
                'phone_1': work_order.assigned_vendor.phone_1
            } if work_order.assigned_vendor else None,
            'parts': [{
                'id': part.id,
                'qty': part.qty,
                'account': part.account,
                'description': part.description,
                'unit_price': float(part.unit_price) if part.unit_price else 0,
                'total_price': float(part.total_price) if part.total_price else 0,
                'line_order': part.line_order
            } for part in sorted(work_order.parts, key=lambda p: p.line_order)],
            'files': [{
                'id': file.id,
                'file_name': file.file_name,
                'file_size': file.file_size,
                'file_type': file.file_type,
                'uploaded_by': file.uploaded_by_user.full_name if file.uploaded_by_user else None,
                'created_at': file.created_at.isoformat() if file.created_at else None
            } for file in work_order.files],
            'tasks': [{
                'id': task.id,
                'task_name': task.task_name,
                'task_type': task.task_type,
                'status': task.status
            } for task in work_order.tasks],
            'created_at': work_order.created_at.isoformat() if work_order.created_at else None,
            'last_updated': work_order.last_updated.isoformat() if work_order.last_updated else None
        }), 200
    except Exception as e:
        print(f"Error fetching work order: {str(e)}")
        return jsonify({'error': str(e)}), 400

@work_order_bp.route('/<int:work_order_id>', methods=['PUT'])
@token_required
def update_work_order(current_user, work_order_id):
    """Update a work order"""
    try:
        # Get work order and verify access
        work_order = db.session.query(WorkOrder).join(Property).filter(
            WorkOrder.id == work_order_id,
            or_(
                Property.owner_id == current_user.id,
                WorkOrder.created_by_user_id == current_user.id
            )
        ).first_or_404()
        
        data = request.get_json()
        
        # Update basic fields
        updateable_fields = [
            'title', 'description', 'status', 'priority', 'category',
            'assigned_to_user_id', 'assigned_vendor_id', 'estimated_cost',
            'actual_cost', 'bill_total', 'bill_status', 'work_to_be_performed',
            'vendor_notes', 'entry_details', 'entry_contact', 'work_hours',
            'charge_hours_to', 'notes'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(work_order, field, data[field])
        
        # Handle due_date separately
        if 'due_date' in data:
            if data['due_date']:
                work_order.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            else:
                work_order.due_date = None
        
        # Update parts if provided
        if 'parts' in data:
            # Remove existing parts
            for part in work_order.parts:
                db.session.delete(part)
            
            # Add new parts
            for i, part_data in enumerate(data['parts']):
                if part_data.get('description') or part_data.get('qty') or part_data.get('unit_price'):
                    part = WorkOrderPart(
                        work_order_id=work_order.id,
                        qty=int(part_data.get('qty', 0)) if part_data.get('qty') else 0,
                        account=part_data.get('account'),
                        description=part_data.get('description'),
                        unit_price=float(part_data.get('unit_price', 0)) if part_data.get('unit_price') else 0,
                        line_order=i
                    )
                    part.calculate_total()
                    db.session.add(part)
        
        work_order.last_updated = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Work order updated successfully',
            'work_order': {
                'id': work_order.id,
                'title': work_order.title,
                'status': work_order.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating work order: {str(e)}")
        return jsonify({'error': str(e)}), 400

@work_order_bp.route('/<int:work_order_id>', methods=['DELETE'])
@token_required
def delete_work_order(current_user, work_order_id):
    """Delete a work order"""
    try:
        # Get work order and verify access
        work_order = db.session.query(WorkOrder).join(Property).filter(
            WorkOrder.id == work_order_id,
            or_(
                Property.owner_id == current_user.id,
                WorkOrder.created_by_user_id == current_user.id
            )
        ).first_or_404()
        
        db.session.delete(work_order)
        db.session.commit()
        
        return jsonify({'message': 'Work order deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting work order: {str(e)}")
        return jsonify({'error': str(e)}), 400

# Task Routes
@work_order_bp.route('/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    """Get all tasks for current user"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        tasks = Task.query.filter_by(created_by_user_id=current_user.id).all()
        
        return jsonify([{
            'id': task.id,
            'task_name': task.task_name,
            'task_type': task.task_type,
            'description': task.description,
            'status': task.status,
            'start_date': task.start_date.isoformat() if task.start_date else None,
            'end_date': task.end_date.isoformat() if task.end_date else None,
            'property': {
                'id': task.property.id,
                'title': task.property.title
            } if task.property else None,
            'assigned_to_user': {
                'id': task.assigned_to_user.id,
                'full_name': task.assigned_to_user.full_name
            } if task.assigned_to_user else None,
            'work_order_count': len(task.work_orders)
        } for task in tasks]), 200
    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        return jsonify({'error': str(e)}), 400

@work_order_bp.route('/export', methods=['GET'])
@token_required
def export_work_orders(current_user):
    """Export work orders to CSV"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        import csv
        import io
        from flask import make_response
        
        # Get work orders for user's properties
        work_orders = db.session.query(WorkOrder).join(Property).filter(
            or_(
                Property.owner_id == current_user.id,
                WorkOrder.created_by_user_id == current_user.id
            )
        ).order_by(WorkOrder.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Work Order #', 'Title', 'Status', 'Priority', 'Property',
            'Assigned Vendor', 'Due Date', 'Bill Total', 'Age (Days)', 'Created Date'
        ])
        
        # Write work order data
        for wo in work_orders:
            writer.writerow([
                wo.work_order_number or '',
                wo.title,
                wo.status,
                wo.priority,
                wo.property.title if wo.property else '',
                wo.assigned_vendor.display_name if wo.assigned_vendor else '',
                wo.due_date.isoformat() if wo.due_date else '',
                float(wo.bill_total) if wo.bill_total else 0,
                wo.get_age_days(),
                wo.created_at.strftime('%Y-%m-%d') if wo.created_at else ''
            ])
        
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=work_orders_{datetime.now().strftime("%Y%m%d")}.csv'
        
        return response
    except Exception as e:
        print(f"Error exporting work orders: {str(e)}")
        return jsonify({'error': str(e)}), 400
