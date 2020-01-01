var welcomeText =
  " ____           _ ____      \n" +
  "|  _ \\ __  __  | / ___|    \n" +
  "| |_) |\\ \\/ /  | \\___ \\  \n" +
  "|  _ <  >  < |_| |___) |    \n" +
  "|_| \\_\\/_/\\_\\___/|____/ \n" +
  "\n开始尝试RxJS:\n" +
  "\n在控制台中输入:\n" +
  "\nrxjs.interval(500).pipe(rxjs.operators.take(4)).subscribe(console.log)\n";
if (console.info) {
  console.info(welcomeText);
} else {
  console.log(welcomeText);
}
