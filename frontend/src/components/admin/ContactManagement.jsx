import React, { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../../utils/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { Mail, Star, StarOff, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const filteredContacts = useMemo(() => {
    return showUnreadOnly ? contacts.filter(c => !c.is_read) : contacts;
  }, [contacts, showUnreadOnly]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/api/admin/contacts');
      const contactList = Array.isArray(res?.contacts)
        ? res.contacts
        : Array.isArray(res?.data?.contacts)
          ? res.data.contacts
          : Array.isArray(res?.data)
            ? res.data
            : [];

      const unread = typeof res?.unread_count === 'number'
        ? res.unread_count
        : typeof res?.data?.unread_count === 'number'
          ? res.data.unread_count
          : contactList.filter(c => !c.is_read).length;

      setContacts(contactList);
      setUnreadCount(unread);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const updateReadStatus = async (id, isRead) => {
    try {
      await apiRequest(`/api/admin/contacts/${id}/read`, {
        method: 'PUT',
        body: JSON.stringify({ is_read: isRead })
      });
      setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: isRead } : c));
      setUnreadCount(prev => isRead ? Math.max(0, prev - 1) : prev + 1);
      toast.success(isRead ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      toast.error('Failed to update read status');
    }
  };

  const toggleImportant = async (id) => {
    try {
      const res = await apiRequest(`/api/admin/contacts/${id}/important`, { method: 'PUT' });
      const important = res?.is_important ?? false;
      setContacts(prev => prev.map(c => c.id === id ? { ...c, is_important: important } : c));
      toast.success(important ? 'Marked important' : 'Unmarked important');
    } catch (err) {
      toast.error('Failed to toggle importance');
    }
  };

  const deleteContact = async (id) => {
    try {
      await apiRequest(`/api/admin/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted');
    } catch (err) {
      toast.error('Failed to delete contact');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Contact Messages</h2>
          <span className="text-sm text-gray-500">Unread: {unreadCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showUnreadOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
            {showUnreadOnly ? 'Showing Unread' : 'Show Unread Only'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadContacts}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {filteredContacts.length === 0 && (
            <p className="text-gray-500 text-sm">No contacts found.</p>
          )}
          {filteredContacts.map(contact => (
            <div key={contact.id} className="py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {contact.is_read ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-yellow-500" />}
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-sm text-gray-600">{contact.email}</span>
                  {contact.company && <span className="text-sm text-gray-500">• {contact.company}</span>}
                  {contact.is_important && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Important</span>}
                  {!contact.is_read && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Unread</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => updateReadStatus(contact.id, !contact.is_read)}>
                    {contact.is_read ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleImportant(contact.id)}>
                    {contact.is_important ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteContact(contact.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-line">{contact.message}</div>
              <div className="text-xs text-gray-500">Received: {contact.created_at}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactManagement;
