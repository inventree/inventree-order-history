"""Order history plugin for InvenTree."""

from part.models import Part
from plugin import InvenTreePlugin
from plugin.mixins import SettingsMixin, UrlsMixin, UserInterfaceMixin

from .version import PLUGIN_VERSION


class OrderHistoryPlugin(SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin):
    """Order history plugin for InvenTree."""

    AUTHOR = "Oliver Walters"
    DESCRIPTION = "Order history plugin for InvenTree"
    VERSION = PLUGIN_VERSION

    MIN_VERSION = '0.17.0'

    NAME = "Order History"
    SLUG = "order_history"
    TITLE = "Order History Plugin"

    SETTINGS = {
        'BUILD_ORDER_HISTORY': {
            'name': 'Build Order History',
            'description': 'Enable build order history tracking',
            'default': True,
            'validator': bool,
        },
        'PURCHASE_ORDER_HISTORY': {
            'name': 'Purchase Order History',
            'description': 'Enable purchase order history tracking',
            'default': True,
            'validator': bool,
        },
        'SALES_ORDER_HISTORY': {
            'name': 'Sales Order History',
            'description': 'Enable sales order history tracking',
            'default': True,
            'validator': bool,
        },
        'RETURN_ORDER_HISTORY': {
            'name': 'Return Order History',
            'description': 'Enable return order history tracking',
            'default': True,
            'validator': bool,
        },
    }

    def get_ui_panels(self, request, context=None, **kwargs):
        """Return a list of UI panels to be rendered in the InvenTree user interface."""

        target = context.get('target_model')
        pk = context.get('target_id')

        if not target or not pk:
            return []
        
        part = None

        # Request must match a valid part
        if target == 'part':
            try:
                part = Part.objects.get(pk=pk)
            except Part.DoesNotExist:
                pass

        if part:
            return [
                {
                    'key': 'order-history',
                    'title': 'Order History',
                    'description': 'View order history for this part',
                    'source': self.plugin_static_file(
                        'OrderHistoryPanel.js:renderPanel'
                    ),
                    'context': {
                        'settings': self.get_settings_dict(),
                    }
                }
            ]

        return []
