const prime = (n) => {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i == 0) console.log(`${i} và ${n / i}`)
  }
}
prime(50)
