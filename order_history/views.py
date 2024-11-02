"""API views for the Order History plugin."""

from typing import cast

from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.views import APIView

from . import helpers
from . import serializers

class HistoryView(APIView):
    """View for generating order history data."""

    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Generate order history data based on the provided parameters."""

        serializer = serializers.OrderHistoryRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = cast(dict, serializer.validated_data)

        self.start_date = data.get('start_date')
        self.end_date = data.get('end_date')
        self.period = data.get('period', 'M')
        self.order_type = data.get('order_type')

        # Construct the date range
        self.date_range = helpers.construct_date_range(
            self.start_date, self.end_date, self.period
        )

        # Generate order history based on the provided parameters
        generators = {
            'build': self.generate_build_order_history,
            'purchase': self.generate_purchase_order_history,
            'sales': self.generate_sales_order_history,
            'return': self.generate_return_order_history,
        }

        if self.order_type in generators:
            data = generators[self.order_type]()

        print("data:", data)

        return Response(self.date_range)

    def generate_build_order_history(self):
        """Generate build order history data."""

        return []

    def generate_purchase_order_history(self):
        """Generate purchase order history data."""

        return []

    def generate_sales_order_history(self):
        """Generate sales order history data."""

        return []
    
    def generate_return_order_history(self):
        """Generate return order history data."""

        return []
