"""Order history plugin for InvenTree."""

from company.models import Company
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
        'USER_GROUP': {
            'name': 'Allowed Group',
            'description': 'The user group that is allowed to view order history',
            'model': 'auth.group',
        }
    }

    def setup_urls(self):
        """Returns the URLs defined by this plugin."""

        from django.urls import path
        from .views import HistoryView

        return [
            path('history/', HistoryView.as_view(), name='order-history'),
        ]

    def is_panel_visible(self, target: str, pk: int) -> bool:
        """Determines whether the order history panel should be visible."""

        # Display for the 'build index' page
        if target == 'manufacturing':
            return self.plugin_settings.get('BUILD_ORDER_HISTORY')

        # Display for the 'purchase order index' page
        if target == 'purchasing':
            return self.plugin_settings.get('PURCHASE_ORDER_HISTORY')

        # Display for a 'supplierpart' object
        if target == 'supplierpart':
            return self.plugin_settings.get('PURCHASE_ORDER_HISTORY')

        # Display for the 'sales' page
        if target == 'sales':
            return self.plugin_settings.get('SALES_ORDER_HISTORY') or self.plugin_settings.get('RETURN_ORDER_HISTORY')

        # Display for a particular company
        if target == 'company':
            try:
                company = Company.objects.get(pk=pk)

                if company.is_supplier and self.plugin_settings.get('PURCHASE_ORDER_HISTORY'):
                    return True
                
                if company.is_customer and (self.plugin_settings.get('SALES_ORDER_HISTORY') or self.plugin_settings.get('RETURN_ORDER_HISTORY')):
                    return True
                
                return False

            except Exception:
                return False

        # Display for a particular part
        if target == 'part':
            try:
                part = Part.objects.get(pk=pk)

                if part.assembly and self.plugin_settings.get('BUILD_ORDER_HISTORY'):
                    return True
                
                if part.purchaseable and self.plugin_settings.get('PURCHASE_ORDER_HISTORY'):
                    return True
                
                if part.salable and (self.plugin_settings.get('SALES_ORDER_HISTORY') or self.plugin_settings.get('RETURN_ORDER_HISTORY')):
                    return True

                return False

            except Exception:
                return False

        # No other targets are supported
        return False

    def get_ui_panels(self, request, context=None, **kwargs):
        """Return a list of UI panels to be rendered in the InvenTree user interface."""

        user = request.user

        if not user or not user.is_authenticated:
            return []
        
        # Cache the settings for this plugin
        self.plugin_settings = self.get_settings_dict()

        # Check that the user is part of the allowed group
        if group := self.plugin_settings.get('USER_GROUP'):
            if not user.groups.filter(pk=group).exists():
                return []

        target = context.get('target_model')
        pk = context.get('target_id')

        # Panel should not be visible for this target!
        if not self.is_panel_visible(target, pk):
            return []

        return [
            {
                'key': 'order-history',
                'title': 'Order History',
                'description': 'View order history for this part',
                'icon': 'history',
                'source': self.plugin_static_file(
                    'OrderHistoryPanel.js:renderPanel'
                ),
                'context': {
                    'settings': self.plugin_settings,
                }
            }
        ]
