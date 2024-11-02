"""API views for the Order History plugin."""

from typing import cast

import tablib

from django.utils.translation import gettext_lazy as _

from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.views import APIView

from InvenTree.helpers import DownloadFile

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
        self.part = data.get('part')
        self.company = data.get('company')
        self.supplier_part = data.get('supplier_part')
        self.export_format = data.get('export')

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
            return generators[self.order_type]()

        # No valid order type provided
        return Response([])

    def generate_build_order_history(self):
        """Generate build order history data."""

        from build.models import Build
        from build.status_codes import BuildStatusGroups

        builds = Build.objects.all()

        if self.part:
            parts = self.part.get_descendants(include_self=True)
            builds = builds.filter(part__in=parts)
        
        builds = builds.filter(
            status__in=BuildStatusGroups.COMPLETE,
            completed__gt=0
        ).prefetch_related(
            'part'
        ).select_related(
            'part__pricing_data'
        )

        # Exclude orders which do not have a completion date, and filter by date range
        builds = builds.exclude(completion_date=None).filter(
            completion_date__gte=self.start_date,
            completion_date__lte=self.end_date
        )

        # Construct a dict of order quantities for each part type
        parts = {}
        history_items = {}

        for build in builds:
            part = build.part

            if part.pk not in parts:
                parts[part.pk] = part

            if part.pk not in history_items:
                history_items[part.pk] = {}

            date_key = helpers.convert_date(build.completion_date, self.period)

            if date_key not in history_items[part.pk]:
                history_items[part.pk][date_key] = 0

            history_items[part.pk][date_key] += build.quantity

        return self.format_response(parts, history_items, 'build')

    def generate_purchase_order_history(self):
        """Generate purchase order history data."""

        from order.models import PurchaseOrderLineItem
        from order.status_codes import PurchaseOrderStatusGroups

        lines = PurchaseOrderLineItem.objects.filter(
            order__status__in=PurchaseOrderStatusGroups.COMPLETE,
            received__gt=0
        ).prefetch_related(
            'part', 'part__part', 'order'
        )

        # Filter by part
        if self.part:
            parts = self.part.get_descendants(include_self=True)
            lines = lines.filter(part__in=parts)

        # Filter by supplier part
        if self.supplier_part:
            lines = lines.filter(part=self.supplier_part)

        # Filter by supplier
        if self.company:
            lines = lines.filter(order__supplier=self.company)

        # TODO: Account for orders lines which have been received but not yet completed

        # Filter by date range
        lines = lines.exclude(order__complete_date=None).filter(
            order__complete_date__gte=self.start_date,
            order__complete_date__lte=self.end_date
        )
        
        # Exclude any lines which do not map to an internal part
        lines = lines.exclude(part__part=None)

        # Construct a dictionary of purchase history data to part ID
        history_items = {}
        parts = {}

        for line in lines:
            part = line.part.part

            part_history = history_items.get(part.pk, None) or {}

            if part.pk not in parts:
                parts[part.pk] = part

            date_key = helpers.convert_date(line.order.complete_date, self.period)
            date_entry = part_history.get(date_key, 0)
            date_entry += line.received

            # Save data back into the dictionary
            part_history[date_key] = date_entry
            history_items[part.pk] = part_history

        return self.format_response(parts, history_items, 'purchase')

    def generate_sales_order_history(self):
        """Generate sales order history data."""

        from order.models import SalesOrderLineItem
        from order.status_codes import SalesOrderStatusGroups

        lines = SalesOrderLineItem.objects.filter(
            order__status__in=SalesOrderStatusGroups.COMPLETE,
            shipped__gt=0
        ).prefetch_related(
            'part', 'order', 'allocations'
        )

        # Filter by part
        if self.part:
            parts = self.part.get_descendants(include_self=True)
            lines = lines.filter(part__in=parts)

        # Filter by customer
        if self.company:
            lines = lines.filter(order__customer=self.company)

        # TODO: Account for order lines which have been shipped but not yet completed

        # Filter by date range
        lines = lines.exclude(order__shipment_date=None).filter(
            order__shipment_date__gte=self.start_date,
            order__shipment_date__lte=self.end_date
        )

        # Construct a dictionary of sales history data to part ID
        history_items = {}
        parts = {}

        for line in lines:
            part = line.part

            # Extract the date key for the line item
            part_history = history_items.get(part.pk, None) or {}

            if part.pk not in parts:
                parts[part.pk] = part

            date_key = helpers.convert_date(line.order.shipment_date, self.period)
            date_entry = part_history.get(date_key, 0)
            date_entry += line.shipped

            # Save data back into the dictionary
            part_history[date_key] = date_entry
            history_items[part.pk] = part_history

        return self.format_response(parts, history_items, 'sales')
    
    def generate_return_order_history(self):
        """Generate return order history data."""

        from order.models import ReturnOrderLineItem
        from order.status_codes import ReturnOrderStatusGroups

        lines = ReturnOrderLineItem.objects.filter(
            order__status__in=ReturnOrderStatusGroups.COMPLETE,
        ).prefetch_related(
            'item', 'item__part', 'order'
        )

        # Filter by part
        if self.part:
            parts = self.part.get_descendants(include_self=True)
            lines = lines.filter(item__part__in=parts)
        
        # Filter by customer
        if self.company:
            lines = lines.filter(order__customer=self.company)

        # TODO: Account for return lines which have been completed but not yet received

        # Filter by date range
        lines = lines.exclude(order__complete_date=None).filter(
            order__complete_date__gte=self.start_date,
            order__complete_date__lte=self.end_date
        )

        history_items = {}
        parts = {}

        for line in lines:
            part = line.item.part

            # Extract the date key for the line item
            part_history = history_items.get(part.pk, None) or {}

            if part.pk not in parts:
                parts[part.pk] = part

            date_key = helpers.convert_date(line.order.complete_date, self.period)
            date_entry = part_history.get(date_key, 0)
            date_entry += line.item.quantity

            # Save data back into the dictionary
            part_history[date_key] = date_entry
            history_items[part.pk] = part_history

        return self.format_response(parts, history_items, 'return')
    
    def format_response(self, part_dict: dict, history_items: dict, order_type: str) -> Response:
        """Format the response data for the order history.
        
        Arguments:
            - part_dict: A dictionary of parts
            - history_items: A dictionary of history items
        """

        if self.export_format:
            # Export the data in the requested format
            return self.export_data(part_dict, history_items, order_type)

        response = []

        for part_id, entries in history_items.items():
            history = [
                {'date': date_key, 'quantity': quantity}
                for date_key, quantity in entries.items()
            ]

            # Ensure that all date keys are present
            for date_key in self.date_range:
                if date_key not in entries:
                    history.append({'date': date_key, 'quantity': 0})

            history = sorted(history, key=lambda x: x['date'])
            
            # Construct an entry for each part
            response.append({
                'part': part_dict[part_id],
                'history': history
            })
        
        return Response(
            serializers.OrderHistoryResponseSerializer(response, many=True).data
        )

    def export_data(self, part_dict: dict, history_items: dict, order_type: str):
        """Export the data in the requested format."""

        # Construct the set of headers
        headers = [_('Part ID'), _('Part Name'), _('IPN'), *self.date_range]

        dataset = tablib.Dataset(headers=headers)

        # Construct the set of rows
        for part_id, entries in history_items.items():
            part = part_dict[part_id]

            quantities = [entries.get(key, 0) for key in self.date_range]

            row = [part_id, part.name, part.IPN, *quantities]

            dataset.append(row)

        data = dataset.export(self.export_format)

        return DownloadFile(data, filename=f'InvenTree_{order_type}_order_history.{self.export_format}')
