import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {

  plan!: string;
  paymentForm!: FormGroup;
  showReceipt = false;
  receiptData: any = null;

  plans: any = {
    free: {
      name: 'Plan Gratis',
      price: 0,
      display: 'S/0',
      features: [
        "Test básico de estrés",
        "5 ejercicios guiados",
        "Reportes limitados"
      ]
    },
    popular: {
      name: 'Plan Popular',
      price: 8.42,
      display: '$8.42 / mes',
      features: [
        "Hasta 5 perfiles",
        "Charla mensual con psicólogo",
        "20 ejercicios y meditaciones",
        "Reportes descargables",
        "Soporte por chat"
      ]
    },
    premium: {
      name: 'Plan Premium',
      price: 22.93,
      display: '$22.93 / mes',
      features: [
        "Perfiles ilimitados",
        "Tests personalizados",
        "Programas corporativos",
        "Métricas avanzadas",
        "Soporte prioritario"
      ]
    }
  };

  constructor(private route: ActivatedRoute, private fb: FormBuilder) {}

  ngOnInit() {
    this.plan = this.route.snapshot.paramMap.get('plan') || 'free';

    this.paymentForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cardNumber: [''],
      expiry: [''],
      cvv: [''],
      method: ['card', Validators.required]
    });
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      alert("Completa todos los campos.");
      return;
    }

    this.receiptData = {
      planName: this.plans[this.plan].name,
      amount: this.plans[this.plan].display,
      method: this.paymentForm.get('method')?.value,
      user: this.paymentForm.value.fullName,
      email: this.paymentForm.value.email,
      date: new Date().toLocaleString(),
    };

    this.showReceipt = true;
  }

  goBack() {
    this.showReceipt = false;
  }
}
