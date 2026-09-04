import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Category } from '@presupuesto/shared';
import { CategoryKind } from '@presupuesto/shared';
import { CategoriesApi } from '../../core/api/categories.service';
import { NotificationsService } from '../../core/notifications.service';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit {
  private readonly api = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly CategoryKind = CategoryKind;
  readonly tree = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly activeKind = signal<CategoryKind>(CategoryKind.EXPENSE);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly visibleRoots = computed(() => this.tree().filter((c) => c.kind === this.activeKind()));

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    kind: [CategoryKind.EXPENSE, Validators.required],
    parentId: [null as string | null],
    color: ['#64748b'],
    icon: ['tag'],
    essential: [false],
  });

  // El formulario no es un signal, así que sin esto `parentOptions` no se enteraría
  // cuando el usuario cambia el "Tipo" en el desplegable.
  private readonly formKind = toSignal(this.form.controls.kind.valueChanges, { initialValue: this.form.controls.kind.value });

  readonly parentOptions = computed(() =>
    this.tree().filter((c) => c.kind === this.formKind() && !c.parentId));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.findTree(true).subscribe({
      next: (tree) => { this.tree.set(tree); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(kind: CategoryKind): void {
    this.activeKind.set(kind);
  }

  openCreate(parent?: Category): void {
    this.editingId.set(null);
    this.form.reset({
      name: '', kind: parent?.kind ?? this.activeKind(), parentId: parent?.id ?? null,
      color: parent?.color ?? '#64748b', icon: parent?.icon ?? 'tag', essential: parent?.essential ?? false,
    });
    this.showForm.set(true);
  }

  openEdit(category: Category): void {
    this.editingId.set(category.id);
    this.form.reset({
      name: category.name, kind: category.kind, parentId: category.parentId,
      color: category.color, icon: category.icon, essential: category.essential,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dto = this.form.getRawValue();
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Categoría actualizada' : 'Categoría creada');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  remove(category: Category): void {
    if (!confirm(`¿Eliminar "${category.name}"?`)) return;
    this.api.remove(category.id).subscribe({
      next: (result) => {
        this.notifications.success(result.archived ? 'Categoría archivada (está en uso)' : 'Categoría eliminada');
        this.load();
      },
    });
  }
}
