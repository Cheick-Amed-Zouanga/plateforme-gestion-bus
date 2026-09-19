from django.core.management.base import BaseCommand

from apps.transport.services import generer_tous_horaires


class Command(BaseCommand):
    help = (
        'Matérialise les prochains départs des horaires récurrents '
        '(heure locale Africa/Ouagadougou).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--nb-departs',
            type=int,
            default=7,
            help='Nombre de prochaines occurrences par horaire (défaut: 7).',
        )
        parser.add_argument(
            '--company-id',
            type=int,
            default=None,
            help='Limiter à une compagnie (id).',
        )

    def handle(self, *args, **options):
        company = None
        company_id = options.get('company_id')
        if company_id:
            from apps.iam.models import Company
            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                self.stderr.write(self.style.ERROR(f'Compagnie #{company_id} introuvable.'))
                return

        # generer_tous_horaires utilise assurer_departs_horaire(nb_departs=7)
        result = generer_tous_horaires(company=company)
        self.stdout.write(
            self.style.SUCCESS(
                f"Horaires traités: {result['horaires']} — "
                f"créés: {result['crees']} — ignorés: {result['ignores']}"
            )
        )
        for err in result['erreurs']:
            self.stdout.write(self.style.WARNING(err))
