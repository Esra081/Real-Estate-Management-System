import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center w-100" [ngClass]="containerClass" *ngIf="totalPages > 0">
      <div class="pagination-info">
        <ng-content></ng-content>
        <span *ngIf="totalCount !== undefined" class="small text-muted" style="font-size: 12px;">
          Sayfa <strong>{{ currentPage }}</strong> / {{ totalPages }} (Toplam {{ totalCount }} kayıt)
        </span>
      </div>

      <ul class="pagination pagination-sm mb-0" *ngIf="totalPages > 1">
        <li class="page-item" [class.disabled]="currentPage === 1">
          <button type="button" class="page-link" (click)="sayfaSec(1)" title="İlk Sayfa">«</button>
        </li>
        <li class="page-item" [class.disabled]="currentPage === 1">
          <button type="button" class="page-link" (click)="sayfaSec(currentPage - 1)" title="Önceki Sayfa">‹</button>
        </li>
        <li class="page-item" *ngFor="let p of sayfalamaDizisi" [class.active]="currentPage === p" [class.disabled]="p === '...'">
          <button type="button" class="page-link" (click)="sayfaSec(p)">{{ p }}</button>
        </li>
        <li class="page-item" [class.disabled]="currentPage === totalPages">
          <button type="button" class="page-link" (click)="sayfaSec(currentPage + 1)" title="Sonraki Sayfa">›</button>
        </li>
        <li class="page-item" [class.disabled]="currentPage === totalPages">
          <button type="button" class="page-link" (click)="sayfaSec(totalPages)" title="Son Sayfa">»</button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .page-link {
      cursor: pointer;
      user-select: none;
    }
    .page-item.disabled .page-link {
      cursor: not-allowed;
    }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalCount?: number;
  @Input() containerClass: string = '';

  @Output() pageChange = new EventEmitter<number>();

  sayfalamaDizisi: (number | string)[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.sayfalamaHesapla();
  }

  sayfaSec(yeniSayfa: number | string): void {
    if (typeof yeniSayfa === 'string' || yeniSayfa === this.currentPage) return;
    if (yeniSayfa >= 1 && yeniSayfa <= this.totalPages) {
      this.pageChange.emit(yeniSayfa);
    }
  }

  private sayfalamaHesapla(): void {
    const total = this.totalPages || 1;
    const current = this.currentPage || 1;

    if (total <= 7) {
      this.sayfalamaDizisi = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (current <= 4) {
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push('...');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }

    this.sayfalamaDizisi = pages;
  }
}
