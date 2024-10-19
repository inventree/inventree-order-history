"""Order history plugin for InvenTree."""


import logging

from django.urls import path

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

    # Javascript file which renders custom plugin settings
    ADMIN_SOURCE = "OrderHistorySettings.js"

    SETTINGS = {
        # TODO: Fill out settings
    }

    def __init__(self):
        """Initializes the OrderHistoryPlugin object."""
        super().__init__()

        self.logger = logging.getLogger('inventree')

    def initialize(self):
        """Initialize the OrderHistoryPlugin object."""
        pass

    def get_urls(self):
        """Return a list of URL patterns for the OrderHistory plugin."""
        return [
            # TODO: Fill out URL patterns
        ]
