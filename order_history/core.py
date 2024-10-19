"""Order history plugin for InvenTree."""

import logging

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
        # TODO: Fill out settings
    }

    def get_ui_panels(self, request, context=None, **kwargs):
        """Return a list of UI panels to be rendered in the InvenTree user interface."""

        print("get_ui_panels:", context)

        return []