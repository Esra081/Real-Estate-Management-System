import { Component, OnInit } from '@angular/core';
import { TasinmazService } from '../../services/tasinmaz'; // Servisimizin yolu
import { Tasinmaz } from '../../models/tasinmaz.model';

@Component({
  selector: 'app-tasinmaz-liste',
  templateUrl: './tasinmaz-liste.component.html',
  styleUrls: ['./tasinmaz-liste.component.scss']
})
export class TasinmazListeComponent implements OnInit {
  tasinmazlar: Tasinmaz[] = []; // Verileri tutacağımız liste

  constructor(private tasinmazService: TasinmazService) { }

  ngOnInit(): void {
    // Component açıldığında verileri API'den çek
    this.tasinmazService.getTasinmazlar().subscribe(data => {
      this.tasinmazlar = data;
    });
  }
}