import { useState } from 'react';
import { searchStudents } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Student } from '@/types/student';

export default function SearchStudentPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setResults(q.length >= 2 ? searchStudents(q) : []);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-serif tracking-tight">Search Students</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, email, or course..." value={query} onChange={e => handleSearch(e.target.value)} className="pl-10" />
      </div>
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(s => (
            <Card key={s.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.email} · {s.course} · Year {s.year}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>{s.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No students found matching "{query}"</p>
      )}
    </div>
  );
}
