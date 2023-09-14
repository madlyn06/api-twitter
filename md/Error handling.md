# Format lỗi

- Thống nhất trả về lỗi theo format nào đó đã quy định.

```ts
{
  message: string
  error_info?: any
}
```

- Lỗi validation (422)

```ts
{
  message: string
  errors: {
    [field1: string]: {
      msg: string
      location: string
      value: any
    }
  }
}
```
