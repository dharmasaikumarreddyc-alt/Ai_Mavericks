import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import Link from 'next/link';
import ProductList from '../components/ProductList';

export const metadata: Metadata = {
  title: 'Agentic AI Checkout | Shop Local Merchants',
  description: 'Discover and shop from local merchants with AI-powered product discovery. Browse groceries, coffee, fresh produce, and everyday essentials from your community.',
};

export default function Shop() {
  return (
    <div className="page-wraper">
      <Preloader />

      <Header />
      
      <div className="page-content bg-light">


		{/* Banner Start */}
		<div className="dz-bnr-inr bg-secondary overlay-black-light" style={{backgroundImage: 'url(/images/background/bg1.jpg)'}}>
			<div className="container">
				<div className="dz-bnr-inr-entry">
					<h1>Browse Local Marketplace</h1>
					<nav aria-label="breadcrumb" className="breadcrumb-row">
						<ul className="breadcrumb">
							<li className="breadcrumb-item"><Link href="/"> Home</Link></li>
							<li className="breadcrumb-item">Browse Local Marketplace</li>
						</ul>
					</nav>
				</div>
			</div>	
		</div>
		{/* Banner End */}
		
		<section className="content-inner-3 pt-3 z-index-unset">
			<div className="container-fluid">
				<div className="row ">
					<div className="col-xl-12">
						<div className="filter-wrapper">
							<div className="filter-left-area">								
								<ul className="filter-tag">
									<li>
										<a href="#" className="tag-btn">Coffee
											<i className="icon feather icon-x tag-close"></i>
										</a>
									</li>
									<li>
										<a href="#" className="tag-btn">Groceries
											<i className="icon feather icon-x tag-close"></i>
										</a>
									</li>
									<li>
										<a href="#" className="tag-btn">Fresh Produce
											<i className="icon feather icon-x tag-close"></i>
										</a>
									</li>
								</ul>
								<span>Showing 1–5 Of 50 Results</span>
							</div>
							<div className="filter-right-area">
								<div className="form-group border-0">
									<a href="#" className="filter-top-btn" id="filterTopBtn">
										<svg className="me-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" width="20" height="20"><g id="Layer_29" data-name="Layer 29"><path d="M2.54,5H15v.5A1.5,1.5,0,0,0,16.5,7h2A1.5,1.5,0,0,0,20,5.5V5h2.33a.5.5,0,0,0,0-1H20V3.5A1.5,1.5,0,0,0,18.5,2h-2A1.5,1.5,0,0,0,15,3.5V4H2.54a.5.5,0,0,0,0,1ZM16,3.5a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5v2a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5Z"></path><path d="M22.4,20H18v-.5A1.5,1.5,0,0,0,16.5,18h-2A1.5,1.5,0,0,0,13,19.5V20H2.55a.5.5,0,0,0,0,1H13v.5A1.5,1.5,0,0,0,14.5,23h2A1.5,1.5,0,0,0,18,21.5V21h4.4a.5.5,0,0,0,0-1ZM17,21.5a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5v-2a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5Z"></path><path d="M8.5,15h2A1.5,1.5,0,0,0,12,13.5V13H22.45a.5.5,0,1,0,0-1H12v-.5A1.5,1.5,0,0,0,10.5,10h-2A1.5,1.5,0,0,0,7,11.5V12H2.6a.5.5,0,1,0,0,1H7v.5A1.5,1.5,0,0,0,8.5,15ZM8,11.5a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5v2a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5Z"></path></g></svg>
										Filter
									</a>
								</div>
								<div className="form-group">
									<select className="default-select">
										<option>Latest</option>
										<option>Popularity</option>
										<option>Average rating</option>
										<option>Latest</option>
										<option>Low to high</option>
										<option>high to Low</option>
									</select>
								</div>
								<div className="form-group Category">
									<select className="default-select">
										<option>Products</option>
										<option>9 Products</option>
										<option>12 Products</option>
										<option>14 Products</option>
										<option>18 Products</option>
										<option>24 Products</option>
									</select>
								</div>
								<div className="shop-tab">
									<ul className="nav" role="tablist" id="dz-shop-tab">
										<li className="nav-item" role="presentation">
											<a href="#tab-list-list" className="nav-link" id="tab-list-list-btn" data-bs-toggle="pill" data-bs-target="#tab-list-list" role="tab" aria-controls="tab-list-list" aria-selected="false" tabIndex={-1}>
												<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
													<g clipPath="url(#clip0_121_190)">
													<path d="M42.667 373.333H96C119.564 373.333 138.667 392.436 138.667 416V469.333C138.667 492.898 119.564 512 96 512H42.667C19.103 512 0 492.898 0 469.333V416C0 392.436 19.103 373.333 42.667 373.333Z" fill="black"></path>
													<path d="M42.667 186.667H96C119.564 186.667 138.667 205.77 138.667 229.334V282.667C138.667 306.231 119.564 325.334 96 325.334H42.667C19.103 325.333 0 306.231 0 282.667V229.334C0 205.769 19.103 186.667 42.667 186.667Z" fill="black"></path>
													<path d="M42.667 0H96C119.564 0 138.667 19.103 138.667 42.667V96C138.667 119.564 119.564 138.667 96 138.667H42.667C19.103 138.667 0 119.564 0 96V42.667C0 19.103 19.103 0 42.667 0Z" fill="black"></path>
													<path d="M230.565 373.333H468.437C492.682 373.333 512.336 392.436 512.336 416V469.333C512.336 492.897 492.682 512 468.437 512H230.565C206.32 512 186.666 492.898 186.666 469.333V416C186.667 392.436 206.32 373.333 230.565 373.333Z" fill="black"></path>
													<path d="M230.565 186.667H468.437C492.682 186.667 512.336 205.77 512.336 229.334V282.667C512.336 306.231 492.682 325.334 468.437 325.334H230.565C206.32 325.334 186.666 306.231 186.666 282.667V229.334C186.667 205.769 206.32 186.667 230.565 186.667Z" fill="black"></path>
													<path d="M230.565 0H468.437C492.682 0 512.336 19.103 512.336 42.667V96C512.336 119.564 492.682 138.667 468.437 138.667H230.565C206.32 138.667 186.666 119.564 186.666 96V42.667C186.667 19.103 206.32 0 230.565 0Z" fill="black"></path>
													</g>
													<defs>
													<clipPath id="clip0_121_190">
													<rect width="512" height="512" fill="white"></rect>
													</clipPath>
													</defs>
												</svg>
											</a>
										</li>
										<li className="nav-item" role="presentation">
											<a href="#tab-list-column" className="nav-link active" id="tab-list-column-btn" data-bs-toggle="pill" data-bs-target="#tab-list-column" role="tab" aria-controls="tab-list-column" aria-selected="true">
												<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xmlSpace="preserve" width="512" height="512">
													<g>
														<path d="M85.333,0h64c47.128,0,85.333,38.205,85.333,85.333v64c0,47.128-38.205,85.333-85.333,85.333h-64   C38.205,234.667,0,196.462,0,149.333v-64C0,38.205,38.205,0,85.333,0z"></path>
														<path d="M362.667,0h64C473.795,0,512,38.205,512,85.333v64c0,47.128-38.205,85.333-85.333,85.333h-64   c-47.128,0-85.333-38.205-85.333-85.333v-64C277.333,38.205,315.538,0,362.667,0z"></path>
														<path d="M85.333,277.333h64c47.128,0,85.333,38.205,85.333,85.333v64c0,47.128-38.205,85.333-85.333,85.333h-64   C38.205,512,0,473.795,0,426.667v-64C0,315.538,38.205,277.333,85.333,277.333z"></path>
														<path d="M362.667,277.333h64c47.128,0,85.333,38.205,85.333,85.333v64C512,473.795,473.795,512,426.667,512h-64   c-47.128,0-85.333-38.205-85.333-85.333v-64C277.333,315.538,315.538,277.333,362.667,277.333z"></path>
													</g>
												</svg>
											</a>
										</li>
										<li className="nav-item" role="presentation">
											<a href="#tab-list-grid" className="nav-link" id="tab-list-grid-btn" data-bs-toggle="pill" data-bs-target="#tab-list-grid" role="tab" aria-controls="tab-list-grid" aria-selected="false" tabIndex={-1}>
												<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_2" x="0px" y="0px" viewBox="0 0 512 512" xmlSpace="preserve" width="512" height="512"><g>
													<path d="M42.667,373.333H96c23.564,0,42.667,19.103,42.667,42.667v53.333C138.667,492.898,119.564,512,96,512H42.667   C19.103,512,0,492.898,0,469.333V416C0,392.436,19.103,373.333,42.667,373.333z"></path>
													<path d="M416,373.333h53.333C492.898,373.333,512,392.436,512,416v53.333C512,492.898,492.898,512,469.333,512H416   c-23.564,0-42.667-19.102-42.667-42.667V416C373.333,392.436,392.436,373.333,416,373.333z"></path>
													<path d="M42.667,186.667H96c23.564,0,42.667,19.103,42.667,42.667v53.333c0,23.564-19.103,42.667-42.667,42.667H42.667   C19.103,325.333,0,306.231,0,282.667v-53.333C0,205.769,19.103,186.667,42.667,186.667z"></path>
													<path d="M416,186.667h53.333c23.564,0,42.667,19.103,42.667,42.667v53.333c0,23.564-19.102,42.667-42.667,42.667H416   c-23.564,0-42.667-19.103-42.667-42.667v-53.333C373.333,205.769,392.436,186.667,416,186.667z"></path>
													<path d="M42.667,0H96c23.564,0,42.667,19.103,42.667,42.667V96c0,23.564-19.103,42.667-42.667,42.667H42.667   C19.103,138.667,0,119.564,0,96V42.667C0,19.103,19.103,0,42.667,0z"></path>
													<path d="M229.333,373.333h53.333c23.564,0,42.667,19.103,42.667,42.667v53.333c0,23.564-19.103,42.667-42.667,42.667h-53.333   c-23.564,0-42.667-19.102-42.667-42.667V416C186.667,392.436,205.769,373.333,229.333,373.333z"></path>
													<path d="M229.333,186.667h53.333c23.564,0,42.667,19.103,42.667,42.667v53.333c0,23.564-19.103,42.667-42.667,42.667h-53.333   c-23.564,0-42.667-19.103-42.667-42.667v-53.333C186.667,205.769,205.769,186.667,229.333,186.667z"></path>
													<path d="M229.333,0h53.333c23.564,0,42.667,19.103,42.667,42.667V96c0,23.564-19.103,42.667-42.667,42.667h-53.333   c-23.564,0-42.667-19.103-42.667-42.667V42.667C186.667,19.103,205.769,0,229.333,0z"></path>
													<path d="M416,0h53.333C492.898,0,512,19.103,512,42.667V96c0,23.564-19.102,42.667-42.667,42.667H416   c-23.564,0-42.667-19.103-42.667-42.667V42.667C373.333,19.103,392.436,0,416,0z"></path>
													</g>
												</svg>
											</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
						<div className="col-xl-12 shop-top-filter">
							<a href="#" className="panel-close-btn">																	
								<svg width="35" height="35" viewBox="0 0 51 50" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M37.748 12.5L12.748 37.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M12.748 12.5L37.748 37.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</a>
							<div className="shop-filter mt-xl-2 mt-0 " id="shopFilter">
								<aside>
									<div className="d-flex d-xl-none align-items-center justify-content-between m-b30">
										<h6 className="title mb-0 fw-normal">
											<svg className="me-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" width="20" height="20"><g id="Layer_28" data-name="Layer 28"><path d="M2.54,5H15v.5A1.5,1.5,0,0,0,16.5,7h2A1.5,1.5,0,0,0,20,5.5V5h2.33a.5.5,0,0,0,0-1H20V3.5A1.5,1.5,0,0,0,18.5,2h-2A1.5,1.5,0,0,0,15,3.5V4H2.54a.5.5,0,0,0,0,1ZM16,3.5a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5v2a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5Z"></path><path d="M22.4,20H18v-.5A1.5,1.5,0,0,0,16.5,18h-2A1.5,1.5,0,0,0,13,19.5V20H2.55a.5.5,0,0,0,0,1H13v.5A1.5,1.5,0,0,0,14.5,23h2A1.5,1.5,0,0,0,18,21.5V21h4.4a.5.5,0,0,0,0-1ZM17,21.5a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5v-2a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5Z"></path><path d="M8.5,15h2A1.5,1.5,0,0,0,12,13.5V13H22.45a.5.5,0,1,0,0-1H12v-.5A1.5,1.5,0,0,0,10.5,10h-2A1.5,1.5,0,0,0,7,11.5V12H2.6a.5.5,0,1,0,0,1H7v.5A1.5,1.5,0,0,0,8.5,15ZM8,11.5a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5v2a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1-.5-.5Z"></path></g></svg>
											Filter
										</h6>
									</div>
									<div className="widget widget_search">
										<div className="form-group">
											<div className="input-group">
												<input name="dzSearch" required type="search" className="form-control" placeholder="Search Product" />
												<div className="input-group-addon">
													<button name="submit" value="Submit" type="submit" className="btn">
														<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="#0D775E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
															<path d="M17.5 17.5L13.875 13.875" stroke="#0D775E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
														</svg>
													</button>
												</div>
											</div>
										</div>
									</div>
									<div className="widget">
										<h6 className="widget-title">Price</h6>
										<div className="price-slide range-slider">
											<div className="price">
												<div className="range-slider style-1">
													<div id="slider-tooltips2" className="mb-3"></div>
													<span className="example-val" id="slider-margin-value-min2"></span>
													<span className="example-val" id="slider-margin-value-max2"></span>
												</div>
											</div>
										</div>
									</div>
									<div className="widget">
										<h6 className="widget-title">Color</h6>
										<div className="d-flex align-items-center flex-wrap color-filter ps-2">
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel01" value="#000000" aria-label="..." defaultChecked />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel02" value="#9BD1FF" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel03" value="#21B290" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel04" value="#FEC4C4" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel05" value="#FF7354" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel06" value="#51EDC8" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel07" value="#B77CF3" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel08" value="#FF4A76" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel09" value="#3E68FF" aria-label="..." />
												<span></span>
											</div>
											<div className="form-check">
												<input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel20" value="#7BEF68" aria-label="..." />
												<span></span>
											</div>
										</div>
									</div>
									
									<div className="widget">
										<h6 className="widget-title">Size</h6>
										<div className="btn-group product-size">
											<input type="radio" className="btn-check" name="btnradio1" id="btnradio101" defaultChecked />
											<label className="btn" htmlFor="btnradio101">4</label>

											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol02" />
											<label className="btn" htmlFor="btnradiol02">6</label>

											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol03" />
											<label className="btn" htmlFor="btnradiol03">8</label>
										  
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol04" />
											<label className="btn" htmlFor="btnradiol04">10</label>
											
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol05" />
											<label className="btn" htmlFor="btnradiol05">12</label>
											
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol06" />
											<label className="btn" htmlFor="btnradiol06">14</label>
											
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol07" />
											<label className="btn" htmlFor="btnradiol07">16</label>
											
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol08" />
											<label className="btn" htmlFor="btnradiol08">18</label>
											
											<input type="radio" className="btn-check" name="btnradio1" id="btnradiol09" />
											<label className="btn" htmlFor="btnradiol09">20</label>
										</div>
									</div>
									
									<div className="widget widget_categories">
										<h6 className="widget-title">Category</h6>
										<ul>
											<li className="cat-item cat-item-26"><a href="blog-category.html">Coffee &amp; Tea</a> (10)</li>
											<li className="cat-item cat-item-36"><a href="blog-category.html">Fresh Produce</a> (5)</li>
											<li className="cat-item cat-item-43"><a href="blog-category.html">Bakery</a> (17)</li>
											<li className="cat-item cat-item-27"><a href="blog-category.html">Dairy &amp; Eggs</a> (13)</li>
											<li className="cat-item cat-item-40"><a href="blog-category.html">Pantry Staples</a> (06)</li>
											<li className="cat-item cat-item-40"><a href="blog-category.html">Beverages</a> (17)</li>
											<li className="cat-item cat-item-40"><a href="blog-category.html">Snacks &amp; Treats</a> (13)</li>
											<li className="cat-item cat-item-43"><a href="blog-category.html">Breakfast Items</a> (06)</li>
											<li className="cat-item cat-item-36"><a href="blog-category.html">Ready-to-Eat</a> (22)</li>
										</ul>
									</div>
									
									<div className="widget widget_tag_cloud">
										<h6 className="widget-title">Tags</h6>
										<div className="tagcloud">
											<a href="blog-tag.html">Organic </a>
											<a href="blog-tag.html">Local</a>
											<a href="blog-tag.html">Fresh</a>
											<a href="blog-tag.html">Artisan</a>
											<a href="blog-tag.html">Seasonal</a>
											<a href="blog-tag.html">Fair Trade</a>
											<a href="blog-tag.html">Specialty</a>
											<a href="blog-tag.html">Gourmet</a>
										</div>
									</div>
								</aside>
							</div>
						</div>
						
						<div className="row">
							<div className="col-12 tab-content shop-" id="pills-tabContent">
								<ProductList />
							</div>
						</div>
						<div className="row page mt-0">
							<div className="col-md-6">
								<p className="page-text">Showing 1–5 Of 50 Results</p>
							</div>
							<div className="col-md-6">
								<nav aria-label="Blog Pagination">
									<ul className="pagination style-1">
										<li className="page-item"><a className="page-link active" href="#">1</a></li>
										<li className="page-item"><a className="page-link" href="#">2</a></li>
										<li className="page-item"><a className="page-link" href="#">3</a></li>
										<li className="page-item"><a className="page-link next" href="#">Next</a></li>
									</ul>
								</nav>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	
	
      </div>
      
      <Footer />
      
      <button className="scroltop" type="button"><i className="fas fa-arrow-up"></i></button>
    </div>
  );
}
