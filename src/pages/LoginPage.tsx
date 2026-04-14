import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
      const user = JSON.parse(sessionStorage.getItem('sms_user')!);
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } else {
      toast({ title: 'Login Failed', description: 'Invalid username or password', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 bg-primary rounded-full mb-4">
            <span className="font-serif text-2xl text-primary-foreground">S</span>
          </div>
          <h1 className="text-3xl font-serif tracking-tight">Student Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your academic journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
            <div className="mt-6 p-4 bg-accent rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-muted-foreground">admin / admin123</p>
                </div>
                <div>
                  <p className="font-medium">Student</p>
                  <p className="text-muted-foreground">aarav.sharma / student123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
