import { getPage, subscribe, useForm as useVortexForm, useRemember as useVortexRemember, Page, link as vortexLink, visible as vortexVisible } from '../index';
import { type Signal as VortexSignal } from "../signals";
import { Injectable, signal, DestroyRef, Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
class VortexService {
    usePage() {
        return this.convertSignalToAngularSignal({ get: getPage, subscribe } as VortexSignal<Page>);
    }

    useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
        return this.convertSignalToAngularSignal(useVortexForm(data, rememberKey));
    }

    useRemember<T extends object>(data: T, key: string = 'default') {
        return this.convertSignalToAngularSignal(useVortexRemember(data, key));
    }

    private convertSignalToAngularSignal<T>({ get, subscribe }: VortexSignal<T>) {
        const angularSignal = signal(get());

        subscribe(angularSignal.set);

        return angularSignal.asReadonly();
    }
}

@Directive({ selector: '[vortexLink]', standalone: true })
export class VortexLinkDirective implements OnInit, OnDestroy {
    @Input('vortexLink') params: any = true;

    private destroyFn?: () => void;
    private updateFn?: (params: any) => void;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private destroyRef: DestroyRef
    ) { }

    ngOnInit() {
        const result = vortexLink(this.elementRef.nativeElement, this.params);

        if (result) {
            this.destroyFn = result.destroy;
            this.updateFn = result.update;
        }

        this.destroyRef.onDestroy(() => {
            this.destroyFn?.();
        });
    }

    ngOnChanges() {
        this.updateFn?.(this.params);
    }

    ngOnDestroy() {
        this.destroyFn?.();
    }
}

@Directive({ selector: '[vortexVisible]', standalone: true })
export class VortexVisibleDirective implements OnInit, OnDestroy {
    @Input('vortexVisible') params: any = true;

    private destroyFn?: () => void;
    private updateFn?: (params: any) => void;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private destroyRef: DestroyRef
    ) { }

    ngOnInit() {
        const result = vortexVisible(this.elementRef.nativeElement, this.params);

        if (result) {
            this.destroyFn = result.destroy;
            this.updateFn = result.update;
        }

        this.destroyRef.onDestroy(() => {
            this.destroyFn?.();
        });
    }

    ngOnChanges() {
        this.updateFn?.(this.params);
    }

    ngOnDestroy() {
        this.destroyFn?.();
    }
}

export function usePage() {
    return inject(VortexService).usePage();
}

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    return inject(VortexService).useForm(data, rememberKey);
}

export function useRemember<T extends object>(data: T, key: string = 'default') {
    return inject(VortexService).useRemember(data, key);
}
