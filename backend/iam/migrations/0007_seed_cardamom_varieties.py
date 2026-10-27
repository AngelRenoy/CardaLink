from django.db import migrations
from decimal import Decimal

def seed_varieties(apps, schema_editor):
    CardamomVariety = apps.get_model('iam', 'CardamomVariety')
    varieties = [
        ('Njallani Green Gold', 'VAR_NJALLANI', 'High-yield cardamom variety developed in Idukki, renowned for dense capsule clusters and disease tolerance.', '800m - 1200m MSL', Decimal('450.00')),
        ('Green Gold Bold', 'VAR_GREEN_GOLD', 'Large capsule 8mm+ bold green cardamom, premium export grade choice.', '900m - 1300m MSL', Decimal('500.00')),
        ('Vandalmedu Special', 'VAR_VANDAL', 'Aromatic small cardamom with intense essential oils and high cineole content.', '700m - 1100m MSL', Decimal('380.00')),
        ('Vanderperiyar', 'VAR_VANDERPERIYAR', 'Resilient traditional variety suited for mist-covered sloping terrains.', '850m - 1250m MSL', Decimal('400.00')),
        ('Palakudi', 'VAR_PALAKUDI', 'Popular shade-tolerant variety delivering consistent bold harvest yield.', '800m - 1100m MSL', Decimal('420.00')),
        ('Panikulangara', 'VAR_PANIKULANGARA', 'Vigorous tiller production with uniform capsule maturation.', '750m - 1150m MSL', Decimal('410.00')),
        ('Appangala', 'VAR_APPANGALA', 'High katte-virus tolerant hybrid variety selected by ICAR-IISR.', '800m - 1300m MSL', Decimal('460.00')),
    ]
    for name, code, desc, alt, yld in varieties:
        if not CardamomVariety.objects.filter(code=code).exists():
            CardamomVariety.objects.create(
                name=name,
                code=code,
                description=desc,
                optimal_altitude=alt,
                yield_potential_kg_acre=yld
            )

class Migration(migrations.Migration):

    dependencies = [
        ('iam', '0006_buyerdeliverytoken_token_type_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_varieties, reverse_code=migrations.RunPython.noop),
    ]
