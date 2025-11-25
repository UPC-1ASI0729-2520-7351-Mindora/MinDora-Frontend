import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {

  plan!: string;
  paymentForm!: FormGroup;
  showReceipt = signal(false);
  showCancelConfirm = signal(false);
  receiptData: any = null;

  plans: any = {
    free: {
      name: 'subscription.plans.free.name',
      price: 0,
      display: 'S/0',
      features: [
        'subscription.plans.free.feature1',
        'subscription.plans.free.feature2',
        'subscription.plans.free.feature3'
      ]
    },
    popular: {
      name: 'subscription.plans.popular.name',
      price: 8.42,
      display: '$8.42',
      features: [
        'subscription.plans.popular.feature1',
        'subscription.plans.popular.feature2',
        'subscription.plans.popular.feature3',
        'subscription.plans.popular.feature4',
        'subscription.plans.popular.feature5'
      ]
    },
    premium: {
      name: 'subscription.plans.premium.name',
      price: 22.93,
      display: '$22.93',
      features: [
        'subscription.plans.premium.feature1',
        'subscription.plans.premium.feature2',
        'subscription.plans.premium.feature3',
        'subscription.plans.premium.feature4',
        'subscription.plans.premium.feature5'
      ]
    }
  };

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private router: Router) {}

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

    // Guardar el plan de suscripción en localStorage
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);
    
    const subscriptionPlan = {
      id: this.plan,
      name: this.plans[this.plan].name,
      price: this.plans[this.plan].price,
      renewalDate: renewalDate.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }),
      isActive: true,
      purchaseDate: new Date().toISOString()
    };
    
    localStorage.setItem('userSubscription', JSON.stringify(subscriptionPlan));

    this.showReceipt.set(true);
  }

  goBack() {
    this.showReceipt.set(false);
  }
  
  goToHome() {
    this.router.navigate(['/home']);
  }
  
  openCancelConfirm() {
    this.showCancelConfirm.set(true);
  }
  
  closeCancelConfirm() {
    this.showCancelConfirm.set(false);
  }
  
  confirmCancelPlan() {
    // Remover la suscripción de localStorage
    localStorage.removeItem('userSubscription');
    
    alert('Tu suscripción ha sido cancelada exitosamente.');
    this.showCancelConfirm.set(false);
    this.showReceipt.set(false);
    this.router.navigate(['/home']);
  }
}
