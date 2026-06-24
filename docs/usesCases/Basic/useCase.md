When
   I import a CSV
   "Customer";"Year";"Month";"Product";"Recalled";"Sold" 
   "Shop A";2025;1;"Tool A";3;5   
   "Shop B";2025;3;"Tool A";43;320
   "Shop A";2025;1;"Tool B";20;15   
   "Shop B";2025;3;"Tool B";43;302
   "Shop A";2025;2;"Tool C";4;303   
   "Shop B";2025;1;"Tool C";41;500   
   "Shop A";2024;1;"Tool A";3;5
   "Shop B";2024;3;"Tool A";43;320
   "Shop A";2024;1;"Tool B";20;15   
   "Shop B";2024;3;"Tool B";43;302
   "Shop A";2024;2;"Tool C";4;303   
   "Shop B";2024;1;"Tool C";41;500
And When I create View Test
    Rows: Customer; Product;
    Columns: Year; Month;
    Measures: Recalled; Sold
And When I have CELL_WIDTH = 120, CELL_HEIGHT = 40
Then I expect, a grid
<!-- pseudo html describe header expected -->
<div class="pivot-grid-wrapper">
    <!-- Header columns -->
    <!-- Header 2024, below 3 period , 2 measure -->
    <div class="header" style="left:{120*2};top:0px;width:{3*2*120)};height:40px">2024</div>
    <!-- Header 2024, Period 1 => below 2 measure -->
    <div class="header" style="left:{120*2};top:40px;width:{2*120)};height:40px">1</div>
    <!-- Header 2024, Period 2 => below 2 measure -->
    <div class="header" style="left:{120*2 + (2*120)};top:40px;width:{2*120);height:40px}">2</div>
    <!-- Header 2024, Period 3 => below 2 measure -->
    <div class="header" style="left:{120*2 + (4*120)};top:40px;width:{2*120);height:40px}">2</div>
    <!-- Header 2024, Period 1, Measure "Recalled" => below 2 measure -->
    <div class="header" style="left:120*2;top:80px;width:120;height:40px}">Recalled</div>
    <!-- Header 2024, Period 1, Measure "Recalled" => below 2 measure -->
    <div class="header" style="left:(120*2+120);top:80px;width:120;height:40px}">Sold</div>
    <!-- ... -->
    <div class="header" style="left:{120*2+previousColumn*120px};top:0px;width:120px; height:{3 * 40px}}">Total row</div>

    <!-- Header rows -->
    <div class="header" style="left:0px;top:{3*40px};width:120px;height:{2 products * 40px}}">Shop A</div>
    <div class="header" style="left:120px;top:{3*40px};width:120px;height:40px">Tool A</div>
    <div class="header" style="left:120px;top:{4*40px};width:120px;height:40px">Tool B</div>

    <!-- Data cells -->
    <!-- ... -->
</div>

    
    


