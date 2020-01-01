import { of } from 'rxjs';
import { pluck } from 'rxjs/operators';

it('should infer correctly', () => {
  const a = of({ name: 'abc' }).pipe(pluck('name')); // $ExpectType Observable<string>
});

it('should support nested object of 2 layer depth', () => {
  const a = of({ a: { name: 'abc' } }).pipe(pluck('a', 'name')); // $ExpectType Observable<string>
});

it('should support nested object of 3 layer depth', () => {
  const a = of({ a: { b: { name: 'abc' } } }).pipe(pluck('a', 'b', 'name')); // $ExpectType Observable<string>
});

it('should support nested object of 4 layer depth', () => {
  const a = of({ a: { b: { c: { name: 'abc' } } } }).pipe(pluck('a', 'b', 'c', 'name')); // $ExpectType Observable<string>
});

it('should support nested object of 5 layer depth', () => {
  const a = of({ a: { b: { c: { d: { name: 'abc' } } } } }).pipe(pluck('a', 'b', 'c', 'd', 'name')); // $ExpectType Observable<string>
});

it('should support nested object of 6 layer depth', () => {
  const a = of({ a: { b: { c: { d: { e: { name: 'abc' } } } } } }).pipe(pluck('a', 'b', 'c', 'd', 'e', 'name')); // $ExpectType Observable<string>
});

it('should support nested object of more than 6 layer depth', () => {
  const a = of({ a: { b: { c: { d: { e: { f: { name: 'abc' } } } } } } }).pipe(pluck('a', 'b', 'c', 'd', 'e', 'f', 'name')); // $ExpectType Observable<unknown>
});

it('should accept existing keys only', () => {
  const a = of({ name: 'abc' }).pipe(pluck('xyz')); // $ExpectType Observable<unknown>
});

it('should not accept empty parameter', () => {
  const a = of({ name: 'abc' }).pipe(pluck()); // $ExpectType Observable<unknown>
});

it('should accept string only', () => {
  const a = of({ name: 'abc' }).pipe(pluck(1)); // $ExpectError
});

it('should accept a spread of arguments', () => {
  const obj = {
    foo: {
      bar: {
        baz: 123
      }
    }
  };

  const path = ['foo', 'bar', 'baz'];
  const a = of(obj).pipe(pluck(...path)); // $ExpectType Observable<unknown>

  const path2 = ['bar', 'baz'];
  const b = of(obj).pipe(pluck('foo', ...path2)); // $ExpectType Observable<unknown>
});
