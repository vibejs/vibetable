export interface RecordItem {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
  amount: number;
  quantity: number;
  date: string;
  children?: RecordItem[];
}
const names = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Dorothy Vaughan',
  'Margaret Hamilton',
  'Katherine Johnson',
  'Edsger Dijkstra',
  'Barbara Liskov',
];
export function createRecords(count = 60): RecordItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `INV-${1000 + index}`,
    name: names[index % names.length],
    email: names[index % names.length].toLowerCase().replace(' ', '.') + '@example.com',
    category: ['Software', 'Hardware', 'Services'][index % 3],
    status: ['Paid', 'Processing', 'Failed'][index % 3],
    amount: ((index * 137) % 10000) / 10 + 19,
    quantity: (index % 20) + 1,
    date: new Date(Date.UTC(2026, 9, (index % 25) + 1)).toISOString(),
  }));
}
export const records = createRecords();
