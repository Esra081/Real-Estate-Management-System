import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TasinmazListeService } from './tasinmaz-liste.service';
import { Tasinmaz } from '../../models/tasinmaz.model';

@Component({
  selector: 'app-tasinmaz-liste',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasinmaz-liste.html',
  styleUrls: ['./tasinmaz-liste.scss']
})
export class TasinmazListeComponent implements OnInit {

  tasinmazlar: Tasinmaz[] = [];
  yukleniyor = true;

  constructor(
    private tasinmazListeService: TasinmazListeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('TasinmazListeComponent başladı');
    this.veriGetir();
  }

  veriGetir(): void {
    console.log('veriGetir çalıştı');

    this.tasinmazListeService.getTasinmazlar().subscribe({
      next: (veri) => {
        console.log('API verisi geldi:', veri);

        this.tasinmazlar = veri;
        this.yukleniyor = false;
        
        console.log('tasinmazlar:', this.tasinmazlar);
        console.log('yukleniyor:', this.yukleniyor);

        this.cdr.detectChanges();
      },

      error: (hata) => {
        console.error('Taşınmazlar yüklenirken hata oluştu:', hata);

        this.yukleniyor = false;

        this.cdr.detectChanges();
      }
    });
  }

  yeniTasinmaz(): void {
    this.router.navigate(['/tasinmaz-ekle']);
  }

  duzenle(id: number): void {
    this.router.navigate(['/tasinmaz-duzenle', id]);
  }

  sil(id: number): void {
    const onay = confirm(
      'Bu taşınmazı silmek istediğinize emin misiniz?'
    );

    if (!onay) {
      return;
    }

    this.tasinmazListeService.tasinmazSil(id).subscribe({
      next: () => {
        this.veriGetir();
      },

      error: (hata) => {
        console.error('Taşınmaz silinirken hata oluştu:', hata);
        alert('Taşınmaz silinirken bir hata oluştu.');
      }
    });
  }
}