export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isToday(dateString: string): boolean {
  const d = new Date(dateString);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(dateString: string): boolean {
  const d = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

export function isWithinDays(dateString: string, days: number): boolean {
  const d = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

export function getMonthYear(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function groupNotesByRelativeDate<T extends { updatedAt: string }>(notes: T[]) {
  const groups: { title: string; data: T[] }[] = [];
  const map = new Map<string, T[]>();

  // Use a stable sort first
  const sorted = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  sorted.forEach((note) => {
    let group = 'Older';
    if (isToday(note.updatedAt)) group = 'Today';
    else if (isYesterday(note.updatedAt)) group = 'Yesterday';
    else if (isWithinDays(note.updatedAt, 7)) group = 'Previous 7 Days';
    else if (isWithinDays(note.updatedAt, 30)) group = 'This Month';
    else group = getMonthYear(note.updatedAt);

    if (!map.has(group)) {
      map.set(group, []);
    }
    map.get(group)!.push(note);
  });

  // Reconstruct in specific order
  const order = ['Today', 'Yesterday', 'Previous 7 Days', 'This Month'];

  order.forEach(title => {
    if (map.has(title)) {
      groups.push({ title, data: map.get(title)! });
      map.delete(title);
    }
  });

  // The rest are month/year strings like "January 2026" and should implicitly be sequentially sorted 
  // because the notes themselves are sorted by time, so we just append them in the order they map.keys() gives them
  for (const [title, data] of map.entries()) {
    groups.push({ title, data });
  }

  return groups;
}
