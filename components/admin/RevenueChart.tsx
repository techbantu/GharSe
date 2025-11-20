import React from 'react';
import { format, subDays } from 'date-fns';

interface RevenueData {
  date: string;
  amount: number;
}

interface RevenueChartProps {
  data?: RevenueData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  // Generate last 7 days if no data provided
  const chartData = data.length > 0 ? data : Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'EEE'), // Mon, Tue, Wed
      amount: Math.floor(Math.random() * 5000) + 1000 // Mock data for visualization if empty
    };
  });

  const maxAmount = Math.max(...chartData.map(d => d.amount), 100);

  return (
    <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Revenue Trend</h3>
        <select className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="flex items-end justify-between h-48 gap-2">
        {chartData.map((item, index) => {
          const heightPercentage = (item.amount / maxAmount) * 100;
          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="relative w-full flex justify-center items-end h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                  ₹{item.amount.toLocaleString()}
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full max-w-[30px] bg-orange-100 rounded-t-md group-hover:bg-orange-200 transition-colors relative overflow-hidden"
                  style={{ height: `${heightPercentage}%` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-500 ease-out"
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-medium text-gray-500">{item.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueChart;
