import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AnimatedChart = ({ 
  type = 'line', 
  data, 
  options = {}, 
  title, 
  subtitle,
  height = 300,
  animationDelay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedData, setAnimatedData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  useEffect(() => {
    if (isVisible && data) {
      // Animate data values
      const animateData = () => {
        const newData = { ...data };
        newData.datasets = data.datasets.map(dataset => ({
          ...dataset,
          data: dataset.data.map((value, index) => {
            // Animate each data point with a slight delay
            setTimeout(() => {
              setAnimatedData(prev => {
                if (!prev) return newData;
                const updated = { ...prev };
                updated.datasets[0].data[index] = value;
                return updated;
              });
            }, index * 100);
            return 0; // Start from 0
          })
        }));
        return newData;
      };

      setAnimatedData(animateData());
    }
  }, [isVisible, data]);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
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
        displayColors: true,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : 'rgba(0, 0, 0, 0.6)',
        },
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : 'rgba(0, 0, 0, 0.6)',
        },
        beginAtZero: true,
      },
    } : {},
    ...options,
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
  }[type];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-700 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="relative" style={{ height: `${height}px` }}>
        {animatedData && (
          <ChartComponent data={animatedData} options={defaultOptions} />
        )}
      </div>
      
      {/* Loading skeleton */}
      {!animatedData && (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      )}
    </div>
  );
};

export default AnimatedChart;
