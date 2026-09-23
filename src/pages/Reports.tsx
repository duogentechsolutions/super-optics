import { Download } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/ui/Toast';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Button, PageHeader } from '../components/ui/primitives';
import { CustomerReport, FollowUpReport, ProductReport, SalesReport } from '../components/reports/ReportSections';
import { TODAY, fmtDateLong } from '../lib/format';
import { productGroupStats, salesSeries } from '../lib/selectors';

export default function Reports() {
  const { state, customers } = useStore();
  const toast = useToast();
  const loading = useFakeLoading(500);

  const exportCsv = () => {
    const lines = ['Section,Label,Value'];
    salesSeries(state, '1Y').forEach((p) => lines.push(`Monthly sales,${p.label},${p.value}`));
    productGroupStats(state).forEach((g) => lines.push(`Product revenue (30d),${g.group},${g.revenue}`));
    lines.push(`Customers,New,${customers.filter((c) => c.type === 'New').length}`);
    lines.push(`Customers,Returning,${customers.filter((c) => c.type === 'Returning').length}`);
    lines.push(`Customers,Inactive,${customers.filter((c) => c.status === 'Inactive').length}`);
    lines.push(`Follow-ups,Pending,${state.followUps.filter((f) => f.status === 'Pending').length}`);
    lines.push(`Follow-ups,Completed,${state.followUps.filter((f) => f.status === 'Completed').length}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opticare-report-${TODAY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report exported', { body: 'CSV downloaded with sales, customer, follow-up and product figures.', tone: 'success' });
  };

  return (
    <div className="page">
      <PageHeader
        title="Reports"
        subtitle={`How the store is growing · as of ${fmtDateLong(TODAY)}`}
        actions={<Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv}>Export CSV</Button>}
      />
      <div className="report-grid">
        <SalesReport state={state} loading={loading} />
        <CustomerReport customers={customers} loading={loading} />
        <FollowUpReport state={state} loading={loading} />
      </div>
      <h2 className="section-title">Products</h2>
      <ProductReport state={state} />
    </div>
  );
}
