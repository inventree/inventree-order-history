"""DRF API serializers for the Order History plugin."""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from company.models import Company, SupplierPart
from part.models import Part
from part.serializers import PartBriefSerializer


class OrderHistoryRequestSerializer(serializers.Serializer):
    """Serializer for requesting history data from the OrderHistory plugin."""

    class Meta:
        fields = [
            'start_date',
            'end_date',
            'period',
            'order_type',
            'part',
            'company',
            'supplier_part',
            'export'
        ]

    start_date = serializers.DateField(label=_('Start Date'), required=True)

    end_date = serializers.DateField(label=_('End Date'), required=True)

    period = serializers.ChoiceField(
        label=_('Period'),
        choices=[('M', _('Month')), ('Q', _('Quarter')), ('Y', _('Year'))],
        required=False,
        default='D',
        help_text=_('Group order data by this period'),
    )

    order_type = serializers.ChoiceField(
        label=_('Order Type'),
        choices=[('build', _('Build Order')), ('purchase', _('Purchase Order')), ('sales', _('Sales Order')), ('return', _('Return Order'))],
        help_text=_('Filter order data by this type'),
    )

    part = serializers.PrimaryKeyRelatedField(
        queryset=Part.objects.all(), many=False, required=False, label=_('Part')
    )

    supplier_part = serializers.PrimaryKeyRelatedField(
        queryset=SupplierPart.objects.all(), many=False, required=False, label=_('Supplier Part')
    )

    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), many=False, required=False, label=_('Company')
    )

    export = serializers.ChoiceField(
        choices=[(choice, choice) for choice in ['csv', 'tsv', 'xls', 'xlsx']],
        required=False,
        label=_('Export Format')
    )


class OrderHistoryItemSerializer(serializers.Serializer):
    """Serializer for a single item in the OrderHistoryResponseSerializer."""

    class Meta:
        """Metaclass options for this serializer."""

        fields = ['date', 'quantity']

    date = serializers.DateField(read_only=True)
    quantity = serializers.FloatField(read_only=True)


class OrderHistoryResponseSerializer(serializers.Serializer):
    """Serializer for returning history data from the OrderHistory plugin."""

    class Meta:
        """Metaclass options for this serializer."""

        fields = ['part', 'history']

    part = PartBriefSerializer(read_only=True, many=False)
    history = OrderHistoryItemSerializer(many=True, read_only=True)
