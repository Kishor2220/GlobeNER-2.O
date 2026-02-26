import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, MapPin, Building2, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Base';

export const StatsOverview = ({ stats }: { stats: any }) => {
  if (!stats) return null;

  const items = [
    { label: 'Total Documents', value: stats.totalDocuments, icon: FileText, color: 'text-emerald-500' },
    { label: 'Total Entities', value: stats.totalEntities, icon: Users, color: 'text-blue-500' },
    { label: 'Avg Confidence', value: `${(stats.averageConfidence * 100).toFixed(1)}%`, icon: ShieldCheck, color: 'text-amber-500' },
    { label: 'Avg Processing', value: `${(stats.averageProcessingTime / 1000).toFixed(2)}s`, icon: Clock, color: 'text-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="p-6 flex items-center gap-4 group hover:border-zinc-700 transition-colors">
            <div className={`p-3 rounded-xl bg-zinc-800/50 ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-2xl font-bold text-zinc-100 mt-1">{item.value}</h3>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
