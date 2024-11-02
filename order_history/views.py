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

        # Construct the date range
        self.date_range = helpers.construct_date_range(
            self.start_date, self.end_date, self.period
        )

        return Response(self.date_range)
