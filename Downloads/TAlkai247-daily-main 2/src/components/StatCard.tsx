interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
}

export default function StatCard({ title, value, bgColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-6 text-white`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}