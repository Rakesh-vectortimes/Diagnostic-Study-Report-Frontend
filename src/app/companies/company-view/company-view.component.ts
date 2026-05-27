import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../core/services/company.service';
import { Company } from '../../shared/models/company.model';

@Component({
  selector: 'app-company-view',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './company-view.component.html',
  styleUrl: './company-view.component.scss',
})
export class CompanyViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);

  company = signal<Company | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyService.getCompanyById(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.company.set(res.data);
          }
        },
      });
    }
  }

  productionSystemLabel(value: unknown): string {
    return this.optionLabel(value, {
      1: 'Preparatory & Assembly',
      2: 'Only Assembly',
    });
  }

  inventoryTypeLabel(value: unknown): string {
    return this.optionLabel(value, {
      1: 'Bundle system',
      2: 'Manual UPS',
      3: 'Hanger UPS',
    });
  }

  workstationTypeLabel(value: unknown): string {
    return this.optionLabel(value, {
      1: 'Sitting',
      2: 'Standing',
    });
  }

  lineConfigurationLabel(value: unknown): string {
    return this.optionLabel(value, {
      1: 'Sewing only',
      2: 'Sewing plus finishing',
      3: 'Sewing plus finishing plus packing',
    });
  }

  private optionLabel(value: unknown, labels: Record<number, string>): string {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? labels[numeric] || '—' : String(value || '—');
  }
}
