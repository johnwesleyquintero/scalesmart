'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export default function CRMComponent() {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  // Initialize customers state from localStorage or as an empty array
  const [customers, setCustomers] = useState<Customer[]>(() => {
    // This function runs only on initial render
    if (typeof window !== 'undefined') {
      const storedCustomers = localStorage.getItem('crmCustomers');
      if (storedCustomers) {
        try {
          return JSON.parse(storedCustomers);
        } catch (error) {
          console.error('Error parsing customers from localStorage:', error);
          return [];
        }
      }
    }
    return [];
  });

  // Effect to save customers to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('crmCustomers', JSON.stringify(customers));
  }, [customers]);

  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    setEditingCustomer(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/; // Basic US phone number format

    // Basic validation
    if (!formData.name || !formData.email) {
      alert('Name and Email are required fields');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      alert('Please enter a valid phone number in the format XXX-XXX-XXXX.');
      return;
    }

    if (editingCustomer) {
      // Update existing customer
      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomer.id
            ? { ...formData, id: editingCustomer.id }
            : customer,
        ),
      );
      setEditingCustomer(null);
      resetForm();
    } else {
      // Add new customer
      const newCustomer = {
        ...formData,
        id: Date.now().toString(),
      };
      setCustomers([...customers, newCustomer]);
      resetForm();
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter((customer) => customer.id !== id));
      if (editingCustomer?.id === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold my-6 text-center">CRM Dashboard</h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Manage your customer relationships, track interactions, and organize
        contact information.
      </p>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(123) 456-7890"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Customer preferences, special requirements, etc."
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              {editingCustomer && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="mr-2"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit">
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground">No customers added yet.</p>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{customer.name}</h3>
                      <p className="text-muted-foreground">{customer.email}</p>
                      {customer.phone && (
                        <p className="text-muted-foreground">
                          {customer.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {customer.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
