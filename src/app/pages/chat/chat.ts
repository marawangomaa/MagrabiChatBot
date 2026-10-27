import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  images?: string[];
}

@Component({
  selector: 'app-chat',
  imports: [RouterLink],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  @ViewChild('messagesEl') messagesEl?: ElementRef<HTMLElement>;

  private auth = inject(AuthService);
  private router = inject(Router);

  readonly messages = signal<ChatMessage[]>([]);
  readonly input = signal('');
  readonly loading = signal(false);

  async send() {
    const text = this.input().trim();
    if (!text || this.loading()) return;

    this.messages.update(m => [...m, { role: 'user', text }]);
    this.input.set('');
    this.loading.set(true);
    this.scrollToBottom();

    try {
      const { data, error } = await this.auth.supabase.functions.invoke('chat', {
        body: { message: text },
      });
      console.log('[chat] raw response:', { data, error });

      if (error) {
        this.messages.update(m => [
          ...m,
          { role: 'assistant', text: 'Error: ' + error.message },
        ]);
      } else if (data?.answer) {
        this.messages.update(m => [
          ...m,
          { role: 'assistant', text: data.answer, images: data.images ?? [] },
        ]);
      } else {
        this.messages.update(m => [
          ...m,
          { role: 'assistant', text: '(empty response) ' + JSON.stringify(data) },
        ]);
      }
    } catch (e: any) {
      console.error('[chat] invoke failed:', e);
      this.messages.update(m => [
        ...m,
        { role: 'assistant', text: 'Error: ' + (e?.message ?? String(e)) },
      ]);
    } finally {
      this.loading.set(false);
      this.scrollToBottom();
    }
  }

  onEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  quickAsk(text: string) {
    this.input.set(text);
    this.send();
  }

  setInput(value: string) {
    this.input.set(value);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}