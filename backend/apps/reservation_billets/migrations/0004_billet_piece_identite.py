from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('reservation_billets', '0003_billet_extended'),
    ]

    operations = [
        migrations.AddField(
            model_name='billet',
            name='passager_piece_identite',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
