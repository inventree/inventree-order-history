# -*- coding: utf-8 -*-

import setuptools

from order_history.version import PLUGIN_VERSION

with open('README.md', encoding='utf-8') as f:
    long_description = f.read()

setuptools.setup(
    name="inventree-order-history",
    version=PLUGIN_VERSION,
    author="Oliver Walters",
    author_email="oliver.henry.walters@gmail.com",
    description="Order history plugin for InvenTree",
    long_description=long_description,
    long_description_content_type='text/markdown',
    keywords="inventree inventory",
    url="https://github.com/inventree/inventree-order-history",
    license="MIT",
    packages=setuptools.find_packages(),
    include_package_data=True,
    install_requires=[
        'tablib',
    ],
    setup_requires=[
        "wheel",
        "twine",
    ],
    python_requires=">=3.9",
    entry_points={
        "inventree_plugins": [
            "OrderHistoryPlugin = order_history.core:OrderHistoryPlugin"
        ]
    },
)
