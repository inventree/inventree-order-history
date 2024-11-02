"""Various helper functions for the order history plugin."""

from datetime import date, timedelta


def date_to_month(d: date) -> date:
    """Convert a date to the first day of the associated month."""
    return d.replace(day=1)


def date_to_quarter(d: date) -> date:
    """Convert a date to the first day of the associated quarter."""
    return d.replace(month=(((d.month - 1) // 3) * 3) + 1, day=1)


def date_to_year(d: date) -> date:
    """Convert a date to the first day of the associated year."""
    return d.replace(month=1, day=1)


def convert_date(d: date, period='M') -> str:
    """Return the associated date for a given date, for the provided time-period.

    Arguments:
        - d: The date to find the associated date for
        - period: The time period to use (e.g. 'W' for week, 'M' for month, 'Q' for quarter, 'Y' for year)
    """
    if not d:
        return None

    # Convert the date to the first day of the associated period (default = month)
    convert_func = {
        'M': date_to_month,
        'Q': date_to_quarter,
        'Y': date_to_year,
    }.get(period, date_to_month)

    return convert_func(d).isoformat().split('T')[0]


def construct_date_range(start_date: date, end_date: date, period='M') -> list:
    """Construct a list of date keys for the provided date range.

    Arguments:
        - start_date: The start date
        - end_date: The end date
        - period: The time period to use (e.g. 'W' for week, 'M' for month, 'Q' for quarter, 'Y' for year)

    Returns:
        A list of date keys for the provided date range
    """
    date_range = set()

    date_range.add(convert_date(start_date, period))

    date = start_date

    while date <= end_date:
        date_range.add(convert_date(date, period))
        date += timedelta(days=20)

    date_range.add(convert_date(end_date, period))

    return sorted(date_range, key=lambda x: x)
