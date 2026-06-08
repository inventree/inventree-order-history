
import { InvenTreePluginContext, ModelType, StylishText } from '@inventreedb/ui';
import { BarChart } from '@mantine/charts';
import { Box, LoadingOverlay, Stack } from '@mantine/core';
import { useDocumentVisibility } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';

const DASHBOARD_URL = 'plugin/order_history/dashboard/';

function OrderHistoryComponent({
  modelType,
  context,
}: {
  modelType: ModelType;
  context: InvenTreePluginContext;
}) {
  
  const visibility = useDocumentVisibility();

  const query = useQuery({
    queryKey: ['dashboard-order-summary', modelType, visibility],
    enabled: visibility === 'visible',
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10 * 60 * 1000, // 10 minute refetch interval
    staleTime: 5 * 60 * 1000, // 5 minute stale time
    queryFn: () => {
      if (visibility !== 'visible') {
        return [];
      }

      return context.api.get(DASHBOARD_URL, { params: { model_type: modelType} }).then((res) => {
        return res.data?.history ?? [];
      });
    }
  }, context?.queryClient);

  const title = useMemo(() => {
    return context.modelInformation?.[modelType]?.label_multiple() || modelType;
   }, [modelType, context.modelInformation]);

   const chartData = useMemo(() => {
    // Build a fixed 12-month window with YYYY-MM keys for matching and MMM YY labels for display
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = dayjs().subtract(11 - i, 'month');
      return { key: d.format('YYYY-MM'), month: d.format('MMM YY'), quantity: 0 };
    });

    for (const entry of (query.data || []) as { date: string; quantity: number }[]) {
      const match = months.find((m) => m.key === entry.date);
      if (match) match.quantity += entry.quantity;
    }

    return months.map(({ month, quantity }) => ({ month, quantity }));
  }, [query.data]);

  return (
    <Stack gap='xs'>
      <StylishText size='md'>{title}</StylishText>
      <Box>
        <LoadingOverlay visible={query.isLoading || query.isFetching} />
        <BarChart
          h={200}
          data={chartData}
          dataKey='month'
          series={[{ name: 'quantity', label: 'Completed', color: 'blue.6' }]}
          withYAxis={false}
          yAxisProps={{ domain: [0, 'auto'] }}
        />
      </Box>
    </Stack>
  );
}


export function BuildOrderSummaryWidget(context: InvenTreePluginContext) {

  console.log("CONTEXT:", context);

  return <OrderHistoryComponent modelType={ModelType.build} context={context} />;
}


export function PurchaseOrderSummaryWidget(context: InvenTreePluginContext) {
    return <OrderHistoryComponent modelType={ModelType.purchaseorder} context={context} />;
}


export function SalesOrderSummaryWidget(context: InvenTreePluginContext) {
    return <OrderHistoryComponent modelType={ModelType.salesorder} context={context} />;
}


export function ReturnOrderSummaryWidget(context: InvenTreePluginContext) {
    return <OrderHistoryComponent modelType={ModelType.returnorder} context={context} />;
}
