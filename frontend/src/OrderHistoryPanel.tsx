import { BarChart, BarChartSeries } from '@mantine/charts';
import { Alert, Box, Button, Card, Group, LoadingOverlay, MantineProvider, Menu, Paper, Select, Text} from '@mantine/core';
import { DateValue, MonthPickerInput } from '@mantine/dates';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import { IconFileDownload } from '@tabler/icons-react';

const queryClient = new QueryClient();

type OrderHistoryPeriod = 'M' | 'Q' | 'Y';

const ORDER_HISTORY_URL = "plugin/order_history/history/";

const COLOR_WHEEL = [
    'blue.6',
    'grape.6',
    'orange.6',
    'lime.6',
    'green.6',
    'cyan.6',
    'yellow.6',
    'violet.6',
    'red.6',
    'teal.6',
    'pink.6',
    'gray.6',
    'indigo.6',
];

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

    }, [context.user, context.instance, pluginSettings]);

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

    }, [context.user, context.instance, pluginSettings]);

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
                return context.instance?.salable;
            case 'company':
                return context.instance?.is_customer;
            case 'sales':
                return true;
            default:
                return false;
        }

    }, [context.user, context.instance, pluginSettings]);

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

    }, [context.user, context.instance, pluginSettings]);

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

    // Ensure that the selected order type is valid for the current context
    useEffect(() => {
        if (!validOrderTypes.find((type: any) => type.value == orderType)) {
            setOrderType(validOrderTypes[0]?.value ?? null);
        }
    }, [orderType, validOrderTypes]);

    // Memoize the query parameters based on the current context
    const queryParams: any = useMemo(() => {
        return {
            start_date: dayjs(startDate).format('YYYY-MM-DD'),
            end_date: dayjs(endDate).format('YYYY-MM-DD'),
            period: period,
            part: context.model == 'part' ? context.id : undefined,
            company: context.model == 'company' ? context.id : undefined,
            supplier_part: context.model == 'supplierpart' ? context.id : undefined,
            order_type: orderType
        };
    }, [
        startDate,
        endDate,
        period,
        orderType,
        context.id,
        context.model,
    ])

    const historyQuery = useQuery(
        {
            queryKey: [
                'order-history',
                startDate,
                endDate,
                period,
                orderType,
                context.id,
                context.model,
            ],
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            queryFn: async () => {
                return context.api?.get(`/${ORDER_HISTORY_URL}`, {
                    params: queryParams,
                }).then((response: any) => {
                    return response.data;
                }).catch(() => {
                    return [];
                }) ?? [];
            }
        },
        queryClient
    )

    // Callback to download the order history data in a specific format
    const downloadData = useCallback((fileFormat: string) => {

        let url = `${ORDER_HISTORY_URL}?export=${fileFormat}`;

        if (context.host) {
            url = `${context.host}${url}`;
        } else {
            url = `${window.location.origin}/${url}`;
        }

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key]) {
                url += `&${key}=${queryParams[key]}`;
            }
        });

        window.open(url, '_blank');

    }, [context.host, queryParams]);

    // Return a chart series for each history entry
    const chartSeries: BarChartSeries[] = useMemo(() => {
        return (
            historyQuery.data?.map((item: any, index: number) => {
                let part = item?.part ?? {};
                let partId : number = part?.pk ?? index;
                let partKey = `id_${partId.toString()}`;

                return {
                    name: partKey,
                    label: part?.full_name ?? part?.name ?? part,
                    color: COLOR_WHEEL[index % COLOR_WHEEL.length],
                };
            }) ?? []
        );
    }, [historyQuery.data]);

    // Return chart data for each history entry
    const chartData : any[] = useMemo(() => {
        let data : any = {};

        historyQuery.data?.forEach((item: any, index: number) => {
            let partId: number = item?.part?.pk ?? index;
            let partKey = `id_${partId.toString()}`;
            let entries: any[] = item?.history ?? [];

            entries.forEach((entry: any) => {
                // Find matching date entry in the data
                let dateEntry = data[entry.date] || {};

                // Add a dummy value to ensure that the date is included in the final data
                dateEntry['_dummy'] = 0;

                // Only display non-zero entries
                if (entry.quantity > 0) {
                    dateEntry[partKey] = entry.quantity;
                }

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

    }, [historyQuery.data]);

    const hasData = useMemo(() => chartData.length > 0 && chartSeries.length > 0, [chartData, chartSeries]);

    return (
        <>
        <Paper withBorder p="sm" m="sm">
        <Group gap="xs" justify='space-apart' grow>
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
            <Group gap="xs" justify='flex-end'>
                <Menu>
                    <Menu.Target>
                        <Button leftSection={<IconFileDownload />}>Export</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={() => downloadData('csv')}>CSV</Menu.Item>
                        <Menu.Item onClick={() => downloadData('xls')} >XLS</Menu.Item>
                        <Menu.Item onClick={() => downloadData('xlsx')}>XLSX</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
            </Group>
            </Paper>
        <Paper withBorder p="sm" m="sm">
            <Box pos="relative">
            <LoadingOverlay visible={historyQuery.isLoading || historyQuery.isFetching} />
            {historyQuery.isError && (
                <Alert color="red" title="Error Loading Data">
                    <Text>Failed to load order history data from the server</Text>
                </Alert>
            )}
            {(hasData || historyQuery.isLoading || historyQuery.isFetching) ? (
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
            </Box>
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
        <MantineProvider theme={context.theme} defaultColorScheme={context.colorScheme}>
            <OrderHistoryPanel context={context}/>
        </MantineProvider>
    )

}