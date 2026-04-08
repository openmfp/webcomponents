import { DeclarativeTable } from '../public-api';
import { Component } from '@angular/core';

@Component({
  selector: 'mfp-declarative-table-card',
  imports: [DeclarativeTable],
  templateUrl: './declarative-table-card.component.html',
  styleUrl: './declarative-table-card.component.scss',
})
export class DeclarativeTableCardComponent {}
