import { MantineProvider, Stack, Text } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


function OrderHistoryPanel(context: any) {
    return (
        <Stack gap="xs">
            <Text>Hello world</Text>
            {context.instance?.pk && <Text>pk: {context.instance.pk}</Text>}
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
    

    createRoot(target).render(
        <StrictMode>
        <MantineProvider>
            <OrderHistoryPanel context={context}/>
        </MantineProvider>
    </StrictMode>
    )

}