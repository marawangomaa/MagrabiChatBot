import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  title = '';
  body = '';
  categoryId: number | null = null;
  brandId: number | null = null;
  countryId: number | null = null;
  language = 'en';
  selectedFile: File | null = null;
  saving = false;
  message = '';

  brands: { id: number; name: string }[] = [];
  countries: { id: number; name: string }[] = [];
  categories: { id: number; name: string }[] = [];

  async ngOnInit() {
    const [{ data: b }, { data: c }, { data: k }] = await Promise.all([
      this.auth.supabase.from('brands').select('id, name').order('name'),
      this.auth.supabase.from('countries').select('id, name').order('name'),
      this.auth.supabase.from('categories').select('id, name').order('name'),
    ]);
    this.brands = b ?? [];
    this.countries = c ?? [];
    this.categories = k ?? [];
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] ?? null;
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  async save() {
    this.saving = true;
    this.message = '';

    const { data: doc, error: docErr } = await this.auth.supabase
      .from('documents')
      .insert({
        title: this.title,
        body: this.body,
        category_id: this.categoryId,
        brand_id: this.brandId,
        country_id: this.countryId,
        language: this.language,
      })
      .select()
      .single();

    if (docErr) {
      this.message = 'Error: ' + docErr.message;
      this.saving = false;
      return;
    }

    if (this.selectedFile) {
      const path = `kb-images/${crypto.randomUUID()}-${this.selectedFile.name}`;
      const { error: upErr } = await this.auth.supabase
        .storage
        .from('kb-images')
        .upload(path, this.selectedFile);

      if (!upErr) {
        await this.auth.supabase.from('document_images').insert({
          document_id: doc.id,
          storage_path: path,
          alt_text: this.title,
        });
      }
    }

    const { error: fnErr } = await this.auth.supabase.functions.invoke('embed', {
      body: { document_id: doc.id, body: this.body },
    });

    if (fnErr) {
      this.message = 'Saved, but embedding failed: ' + fnErr.message;
    } else {
      this.message = '✅ Saved and embedded successfully!';
      this.title = '';
      this.body = '';
      this.selectedFile = null;
      this.categoryId = null;
      this.brandId = null;
      this.countryId = null;
    }
    this.saving = false;
  }
}