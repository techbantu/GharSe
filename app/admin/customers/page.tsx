'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
  };
  pricing: {
    total: number;
  };
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            processCustomerData(data.orders);
          }
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const processCustomerData = (orders: Order[]) => {
    const customerMap = new Map<string, Customer>();

    orders.forEach(order => {
      // Use phone as unique identifier, fallback to name, or skip if neither
      const identifier = order.customer?.phone || order.customer?.name;
      if (!identifier) return;

      const existing = customerMap.get(identifier);
      const orderTotal = Number(order.pricing?.total) || 0;

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += orderTotal;
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        // Update address if newer order has one
        if (order.deliveryAddress) existing.address = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`;
      } else {
        customerMap.set(identifier, {
          id: identifier, // Using phone/name as ID for now
          name: order.customer?.name || 'Guest',
          phone: order.customer?.phone || 'Not provided',
          address: order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 'Pickup',
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: order.createdAt
        });
      }
    });

    setCustomers(Array.from(customerMap.values()));
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const customerRows = filteredCustomers.length === 0 ? (
    <tr>
      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
        No customers found
      </td>
    </tr>
  ) : (
    filteredCustomers.map((customer, idx) => (
      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563'
            }}>
              <User size={16} />
            </div>
            <div>
              <p style={{ fontWeight: 500, color: '#111827' }}>{customer.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{customer.address}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
          </div>
        </td>
        <td style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={16} style={{ color: '#9ca3af' }} />
            <span style={{ fontWeight: 500, color: '#111827' }}>{customer.totalOrders}</span>
          </div>
        </td>
        <td style={{ padding: '1rem' }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>
            ₹{customer.totalSpent.toLocaleString('en-IN')}
          </span>
        </td>
        <td style={{ padding: '1rem', color: '#6b7280' }}>
          {format(new Date(customer.lastOrderDate), 'MMM d, yyyy')}
        </td>
      </tr>
    ))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Customers</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Manage and view customer details
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.625rem 1rem 0.625rem 2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              fontSize: '0.875rem',
              width: '300px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Customer</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Contact</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Orders</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Total Spent</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Last Order</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.875rem' }}>
            {customerRows}
          </tbody>
        </table>
        </div>
    </div>
  );
}
