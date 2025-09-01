from flask import Blueprint, request, jsonify
from models.association import (Association, OwnershipAccount, AssociationMembership,
                              AssociationBalance, Violation)
from config import db
from datetime import datetime

association_bp = Blueprint('association_bp', __name__)