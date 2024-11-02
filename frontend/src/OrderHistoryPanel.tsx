import { MantineProvider, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';


const ORDER_HISTORY_URL = "/plugin/order-history/history/";


function OrderHistoryPanel({context}: {context: any}) {

    console.log('OrderHistoryPanel', context);

    // Starting date for the order history
    const [startDate] = useState<Date>(
        dayjs().subtract(1, 'year').toDate()
      );
    
    // Ending date for the order history
      const [endDate] = useState<Date>(
        dayjs().add(1, 'month').toDate()
      );

    useEffect(() => {
        console.log("Fetching history Data:");

        context.api?.get(ORDER_HISTORY_URL, {
            params: {
                start_date: dayjs(startDate).format('YYYY-MM-DD'),
                end_date: dayjs(endDate).format('YYYY-MM-DD')
            }
        }).then((response: any) => response.data).catch(() => {}) ?? [];

    }, []);

    return (
        <Stack gap="xs">
            <Text>Order History 12345</Text>
            <Text>Model: {context.model}</Text>
            <Text>ID: {context.instance?.pk}</Text>
        </Stack>
    )
}


/**
 * Render the OrderHistoryPanel component
 * 
 * @param target - The target HTML element to render the panel into
 * @param context - The context object to pass to the panel
 */
export function renderPanel(target: HTMLElement, context: any) {

    const colorScheme = context?.colorScheme ?? 'light';

    console.log("renderPanel:", colorScheme);

    createRoot(target).render(
        <MantineProvider theme={context.theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
            <OrderHistoryPanel context={context}/>
        </MantineProvider>
    )

}