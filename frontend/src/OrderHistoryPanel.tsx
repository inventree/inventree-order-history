import { BarChart, BarChartSeries } from '@mantine/charts';
import { Alert, Card, Group, MantineProvider, Paper, Select, Text} from '@mantine/core';
import { DateValue, MonthPickerInput } from '@mantine/dates';
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';


const ORDER_HISTORY_URL = "/plugin/order_history/history/";

type OrderHistoryPeriod = 'M' | 'Q' | 'Y';

function OrderHistoryPanel({context}: {context: any}) {

    // Plugin settings object
    const pluginSettings = useMemo(() => context?.context?.settings ?? {}, [context]);

    // Starting date for the order history
    const [startDate, setStartDate ] = useState<Date>(
        dayjs().subtract(1, 'year').toDate()
      );
    
    // Ending date for the order history
      const [endDate, setEndDate] = useState<Date>(
        dayjs().add(1, 'month').toDate()
      );

    // Grouping period for the order history
    const [ period, setPeriod ] = useState<OrderHistoryPeriod>('M');

    // Order history data (loaded via the API)
    const [ historyData, setHistoryData ] = useState<any[]>([]);

    // Determine if current context supports PurchaseOrders
    const supportsPurchaseOrders = useMemo(() => {

        // User must have permission to view purchase orders
        if (!context?.user?.hasViewRole('purchase_order')) {
            return false;
        }

        // PurchaseOrder history disabled for plugin
        if (!pluginSettings.PURCHASE_ORDER_HISTORY) {
            return false;
        }

        switch (context.model) {
            case 'part':
                return context.instance?.purchaseable;
            case 'company':
                return context?.instance?.is_supplier;
            case 'purchasing':
            case 'supplierpart':
                return true;
            default:
                return false;
        }

    }, [pluginSettings, context]);

    // Determine if current context supports SalesOrders
    const supportsSalesOrders = useMemo(() => {

        // User must have permission to view sales orders
        if (!context?.user?.hasViewRole('sales_order')) {
            return false;
        }

        // SalesOrder history disabled for plugin
        if (!pluginSettings.SALES_ORDER_HISTORY) {
            return false;
        }

        switch (context.model) {
            case 'part':
                return context.instance?.salable;
            case 'company':
                return context.instance?.is_customer;
            case 'sales':
                return true;
            default:
                return false;
        }

    }, [context]);

    // Determine if the current context supports ReturnOrders
    const supportsReturnOrders = useMemo(() => {

        // User must have permission to view return orders
        if (!context?.user?.hasViewRole('return_order')) {
            return false;
        }

        // ReturnOrder history disabled for plugin
        if (!pluginSettings.RETURN_ORDER_HISTORY) {
            return false;
        }

        switch (context.model) {
            case 'part':
                return context.instance?.is_salable;
            case 'company':
                return context.instance?.is_customer;
            case 'sales':
                return true;
            default:
                return false;
        }

    }, [context]);

    // Determine if current context supports BuildOrders
    const supportsBuildOrders = useMemo(() => {

        // User must have permission to view build orders
        if (!context?.user?.hasViewRole('build')) {
            return false;
        }

        // BuildOrder history disabled for plugin
        if (!pluginSettings.BUILD_ORDER_HISTORY) {
            return false;
        }

        switch (context.model) {
            case 'part':
                return context.instance?.assembly;
            case 'manufacturing':
                return true;
            default:
                return false;
        }

    }, [context]);

    // Determine which "types" of orders are valid for the current context
    const validOrderTypes = useMemo(() => {

        let types = [];

        if (supportsBuildOrders) {
            types.push({
                value: 'build',
                label: 'Build Orders'
            });
        }

        if (supportsPurchaseOrders) {
            types.push({
                value: 'purchase',
                label: 'Purchase Orders'
            });
        }

        if (supportsSalesOrders) {
            types.push({
                value: 'sales',
                label: 'Sales Orders'
            });
        }

        if (supportsReturnOrders) {
            types.push({
                value: 'return',
                label: 'Return Orders'
            });
        }

        return types;
    }, [
        supportsPurchaseOrders,
        supportsSalesOrders,
        supportsBuildOrders,
        supportsReturnOrders
    ]);

    const [ orderType, setOrderType ] = useState<string | null>(null);

    useEffect(() => {

        if (!validOrderTypes.find((type) => type.value == orderType)) {
            setOrderType(validOrderTypes[0]?.value ?? null);
        }
    }, [orderType, validOrderTypes]);

    // Request order history data from the API
    useEffect(() => {

        // Order type must be provided
        if (!orderType) {
            setHistoryData([]);
            return;
        }

        context?.api?.get(ORDER_HISTORY_URL, {
            params: {
                start_date: dayjs(startDate).format('YYYY-MM-DD'),
                end_date: dayjs(endDate).format('YYYY-MM-DD'),
                period: period,
                part: context.model == 'part' ? context.id : undefined,
                company: context.model == 'company' ? context.id : undefined,
                supplier_part: context.model == 'supplierpart' ? context.id : undefined,
                order_type: orderType,
            }
        }).then((response: any) => {
            setHistoryData(response.data);
        }).catch(() => {
            console.error("ERR: Failed to fetch history data");
            setHistoryData([]);
        });

    }, [startDate, endDate, period, orderType, context.model, context.id]);

    // Return a chart series for each history entry
    const chartSeries: BarChartSeries[] = useMemo(() => {
        return (
            historyData.map((item: any, index: number) => {
                let part = item?.part ?? {};
                let partId : number = part?.pk ?? index;
                let partKey = `id_${partId.toString()}`;

                return {
                    name: partKey,
                    label: part?.full_name ?? part?.name ?? part,
                    color: 'blue.6',
                };
            }) ?? []
        );
    }, [historyData]);

    // Return chart data for each history entry
    const chartData : any[] = useMemo(() => {
        let data : any = {};

        historyData?.forEach((item: any, index: number) => {
            let partId: number = item?.part?.pk ?? index;
            let partKey = `id_${partId.toString()}`;
            let entries: any[] = item?.history ?? [];

            entries.forEach((entry: any) => {
                // Find matching date entry in the data
                let dateEntry = data[entry.date] || {};
                dateEntry[partKey] = entry.quantity;
                data[entry.date] = dateEntry;
            });
        });

        // Sort the data by date
        let sortedData = Object.keys(data).sort();

        return sortedData.map((date: string) => {
            return {
                date: date,
                ...data[date]
            };
        });

    }, [historyData]);

    const hasData = useMemo(() => chartData.length > 0 && chartSeries.length > 0, [chartData, chartSeries]);

    return (
        <>
        <Paper withBorder p="sm" m="sm">
        <Group gap="xs">
            <Select
                data={validOrderTypes}
                value={orderType}
                onChange={(value: string | null) => {
                    if (value) {
                        setOrderType(value);
                    }
                }}
                label={`Order Type`}
            />
            <MonthPickerInput
            value={startDate}
            label={`Start Date`}
            onChange={(value: DateValue) => {
                if (value && value < endDate) {
                    setStartDate(value);
                }
            }}
            />
            <MonthPickerInput
            value={endDate}
            label={`End Date`}
            onChange={(value: DateValue) => {
                if (value && value > startDate) {
                    setEndDate(value);
                }
            }}
            />
            <Select 
                data={[
                    { value: 'M', label: `Monthly` },
                    { value: 'Q', label: `Quarterly` },
                    { value: 'Y', label: `Yearly` }
                ]}
                value={period}
                onChange={(value: string | null) => {
                    if (value) {
                        setPeriod(value as OrderHistoryPeriod);
                    }
                }}
                label={`Grouping Period`}
            />
            </Group>
            </Paper>
        <Paper withBorder p="sm" m="sm">
            {hasData ? (
                <Card>
                <BarChart
                    h={500}
                    dataKey="date"
                    type="stacked"
                    data={chartData}
                    series={chartSeries}
                    />
                </Card>
            ) : (
                <Alert color="blue" title="No Data Available">
                    <Text>No order history data found, based on the provided parameters</Text>
                </Alert>
            )}
        </Paper>
        </>
    );
}


/**
 * Render the OrderHistoryPanel component
 * 
 * @param target - The target HTML element to render the panel into
 * @param context - The context object to pass to the panel
 */
export function renderPanel(target: HTMLElement, context: any) {

    createRoot(target).render(
        <MantineProvider>
            <OrderHistoryPanel context={context}/>
        </MantineProvider>
    )

}