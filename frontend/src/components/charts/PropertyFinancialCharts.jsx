import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mortgage Payment Breakdown Chart
export const MortgagePaymentBreakdownChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading mortgage data...</div>
      </div>
    );
  }

  const monthlyPayment = data.monthlyPayment || 1896.20;
  const apr = data.apr || 6.50;
  const loanTerm = data.loanTerm || 30;
  const loanAmount = data.loanAmount || 300000; // Purchase price - down payment

  // Calculate principal and interest breakdown (simplified calculation)
  const monthlyRate = apr / 100 / 12;
  const totalPayments = loanTerm * 12;
  const interestPayment = loanAmount * monthlyRate;
  const principalPayment = monthlyPayment - interestPayment;

  const chartData = {
    labels: ['Principal Payment', 'Interest Payment'],
    datasets: [
      {
        data: [principalPayment, interestPayment],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for principal
          'rgba(239, 68, 68, 0.8)', // Red for interest
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

// Monthly Expense Breakdown Chart
export const MonthlyExpenseBreakdownChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading expense data...</div>
      </div>
    );
  }

  const monthlyPayment = data.monthlyPayment || 1896.20;
  const annualTaxes = data.annualTaxes || 6000.00;
  const annualInsurance = data.annualInsurance || 1800.00;
  const hoaFees = data.hoaFees || 100.00;

  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;

  const chartData = {
    labels: ['Mortgage Payment', 'Property Taxes', 'Insurance', 'HOA Fees'],
    datasets: [
      {
        data: [monthlyPayment, monthlyTaxes, monthlyInsurance, hoaFees],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue for mortgage
          'rgba(245, 158, 11, 0.8)', // Yellow for taxes
          'rgba(16, 185, 129, 0.8)', // Green for insurance
          'rgba(139, 92, 246, 0.8)', // Purple for HOA
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

// Property Value and Equity Chart
export const PropertyValueEquityChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading property value data...</div>
      </div>
    );
  }

  const totalValue = data.totalValue || 430000.00;
  const purchasePrice = data.purchasePrice || 430000.00;
  const downPayment = data.downPayment || 130000.00;
  const loanAmount = purchasePrice - downPayment;
  const equity = totalValue - loanAmount;

  const chartData = {
    labels: ['Property Value Breakdown'],
    datasets: [
      {
        label: 'Equity',
        data: [equity],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
      {
        label: 'Remaining Loan',
        data: [loanAmount],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Monthly Cash Flow Analysis Chart
export const MonthlyCashFlowChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading cash flow data...</div>
      </div>
    );
  }

  const monthlyRent = data.monthlyRent || 2500.00; // Assuming rental income
  const monthlyPayment = data.monthlyPayment || 1896.20;
  const annualTaxes = data.annualTaxes || 6000.00;
  const annualInsurance = data.annualInsurance || 1800.00;
  const hoaFees = data.hoaFees || 100.00;

  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;
  const totalMonthlyExpenses = monthlyPayment + monthlyTaxes + monthlyInsurance + hoaFees;
  const netCashFlow = monthlyRent - totalMonthlyExpenses;

  const chartData = {
    labels: ['Monthly Cash Flow Analysis'],
    datasets: [
      {
        label: 'Rental Income',
        data: [monthlyRent],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
      {
        label: 'Total Expenses',
        data: [totalMonthlyExpenses],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
      {
        label: 'Net Cash Flow',
        data: [netCashFlow],
        backgroundColor: netCashFlow >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        borderColor: netCashFlow >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// ROI and Profitability Analysis Chart
export const ROIAnalysisChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading ROI data...</div>
      </div>
    );
  }

  const monthlyRent = data.monthlyRent || 2500.00;
  const annualRent = monthlyRent * 12;
  const downPayment = data.downPayment || 130000.00;
  const annualTaxes = data.annualTaxes || 6000.00;
  const annualInsurance = data.annualInsurance || 1800.00;
  const hoaFees = data.hoaFees || 100.00;
  const monthlyPayment = data.monthlyPayment || 1896.20;
  const annualMortgage = monthlyPayment * 12;

  const totalAnnualExpenses = annualTaxes + annualInsurance + (hoaFees * 12) + annualMortgage;
  const netAnnualIncome = annualRent - totalAnnualExpenses;
  const cashOnCashROI = (netAnnualIncome / downPayment) * 100;
  const capRate = (netAnnualIncome / (data.totalValue || 430000)) * 100;

  const chartData = {
    labels: ['ROI Analysis'],
    datasets: [
      {
        label: 'Cash-on-Cash ROI (%)',
        data: [cashOnCashROI],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Cap Rate (%)',
        data: [capRate],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toFixed(1) + '%';
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Property Performance Timeline Chart
export const PropertyPerformanceTimelineChart = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-300">Loading performance data...</div>
      </div>
    );
  }

  // Generate sample monthly data for the past 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRent = data.monthlyRent || 2500.00;
  const monthlyPayment = data.monthlyPayment || 1896.20;
  const annualTaxes = data.annualTaxes || 6000.00;
  const annualInsurance = data.annualInsurance || 1800.00;
  const hoaFees = data.hoaFees || 100.00;

  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;
  const totalMonthlyExpenses = monthlyPayment + monthlyTaxes + monthlyInsurance + hoaFees;

  // Generate realistic monthly variations
  const incomeData = months.map(() => monthlyRent + (Math.random() - 0.5) * 200);
  const expenseData = months.map(() => totalMonthlyExpenses + (Math.random() - 0.5) * 100);
  const netIncomeData = incomeData.map((income, index) => income - expenseData[index]);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Income',
        data: incomeData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Monthly Expenses',
        data: expenseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Net Income',
        data: netIncomeData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
