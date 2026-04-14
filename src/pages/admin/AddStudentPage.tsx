import { useState } from 'react';
import { addStudent } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const COURSES = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Economics', 'Mechanical Engineering'];

export default function AddStudentPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', course: '', year: '1', status: 'active' as const, enrollmentDate: new Date().toISOString().split('T')[0] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.course) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    addStudent({ ...form, year: parseInt(form.year) });
    toast({ title: 'Student Added', description: `${form.name} has been enrolled successfully` });
    setForm({ name: '', email: '', phone: '', course: '', year: '1', status: 'active', enrollmentDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-serif tracking-tight mb-6">Add New Student</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@university.edu" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select value={form.course} onValueChange={v => setForm({ ...form, course: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={form.year} onValueChange={v => setForm({ ...form, year: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enrollment Date</Label>
                <Input type="date" value={form.enrollmentDate} onChange={e => setForm({ ...form, enrollmentDate: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full">Enroll Student</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
