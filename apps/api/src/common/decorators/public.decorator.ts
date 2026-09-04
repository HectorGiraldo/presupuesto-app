import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como accesible sin token. El guard JWT es global, así que esta es la excepción. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
