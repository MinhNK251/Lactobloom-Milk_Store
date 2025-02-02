import PropTypes from "prop-types";
import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getProductCartQuantity } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import { addToCart } from "../../store/slices/cart-slice";
import { addToWishlist } from "../../store/slices/wishlist-slice";
import { addToCompare } from "../../store/slices/compare-slice";
import { getProductReviewByProductId } from "../../utils/ProductReviewService";
import { getCategoryByProductId } from "../../utils/CategoryService";
import { getBrandByProductId } from "../../utils/BrandService";
import Cookies from "js-cookie";
import { myWishlist, saveWishlist } from "../../utils/WishlistService";

const ProductDescriptionInfo = ({
  product,
  discountedPrice,
  finalDiscountedPrice,
  finalProductPrice,
  cartItems,
  wishlistItem,
  compareItem,
}) => {
  const dispatch = useDispatch();
  const [quantityCount, setQuantityCount] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [isProductInWishlist, setIsProductInWishlist] = useState(false);
  const authToken = Cookies.get("authToken");

  const productCartQty = getProductCartQuantity(cartItems, product);

  useEffect(() => {
    // Fetch the reviews from the API
    getProductReviewByProductId(product.productId)
      .then((response) => {
        const reviews = response.data;
        const totalRating = reviews.reduce((acc, review) => acc + review.rate, 0);
        const avgRating = reviews.length ? totalRating / reviews.length : 0;
        setAverageRating(avgRating);
      })
      .catch((error) => {
        console.error("Error fetching the reviews:", error);
      });

    // Fetch the category from the API
    getCategoryByProductId(product.productId)
      .then((response) => {
        setCategory(response.data);
      })
      .catch((error) => {
        console.error("Error fetching the category:", error);
      });

    // Fetch the brand from the API
    getBrandByProductId(product.productId)
      .then((response) => {
        setBrand(response.data);
      })
      .catch((error) => {
        console.error("Error fetching the brand:", error);
      });

    // Check if product is in wishlist
    if (authToken) {
      myWishlist(authToken)
        .then((response) => {
          const wishlistData = response.data;
          setIsProductInWishlist(wishlistData.some(item => item.productId === product.productId));
        })
        .catch((error) => {
          console.error("Error fetching wishlist data:", error);
        });
    }
  }, [product.productId, authToken]);

  const handleWishlistClick = async () => {
    if (authToken) {
      try {
        await saveWishlist(authToken, product.productId);
        dispatch(addToWishlist(product));
        setIsProductInWishlist(true);
      } catch (error) {
        console.error("Error saving to wishlist:", error);
      }
    } else {
      dispatch(addToWishlist(product));
      setIsProductInWishlist(true);
    }
  };

  return (
    <div className="product-details-content ml-70">
      {(product.stock >= 0 && product.preOrder && authToken) ?
      <h2>{product.productName} (Đặt trước)</h2> 
      : <h2>{product.productName}</h2>}
      <div className="product-details-price">
        {discountedPrice !== null ? (
          <Fragment>
            <span>{finalDiscountedPrice.toLocaleString("vi-VN") + " VND"}</span>{" "}
            <span className="old">
              {finalProductPrice.toLocaleString("vi-VN") + " VND"}
            </span>
          </Fragment>
        ) : (
          <span>{finalProductPrice.toLocaleString("vi-VN") + " VND"} </span>
        )}
      </div>
      {averageRating && averageRating > 0 ? (
        <div className="pro-details-rating-wrap">
          <div className="pro-details-rating">
            <Rating ratingValue={averageRating} />
          </div>
          <span>({averageRating.toFixed(1)} / 5)</span>
        </div>
      ) : (
        <div className="pro-details-rating-wrap">
          <div className="pro-details-rating">
            <Rating ratingValue={0} />
          </div>
          <span>(0 / 5)</span>
        </div>
      )}
      <div className="pro-details-list">
        <p>{product.description}</p>
      </div>

        <div className="pro-details-quality">
          <div className="cart-plus-minus">
            <button
              onClick={() =>
                setQuantityCount(quantityCount > 1 ? quantityCount - 1 : 1)
              }
              className="dec qtybutton"
            >
              -
            </button>
            <input
              className="cart-plus-minus-box"
              type="text"
              value={quantityCount}
              readOnly
            />
            <button

              onClick={() => {
                if ((product.stock <= 0 && product.preOrder && authToken)) {
                  setQuantityCount(quantityCount + 1);
                } else {
                  setQuantityCount(
                    quantityCount < product.stock - productCartQty
                      ? quantityCount + 1
                      : quantityCount
                  );
                }
              }}
              className="inc qtybutton"
            >
              +
            </button>
          </div>
          <div className="pro-details-cart btn-hover">
            {product.stock && product.stock > 0 && product.preOrder === false ? (
              <button
                onClick={() =>
                  dispatch(
                    addToCart({
                      ...product,
                      quantity: quantityCount,
                    })
                  )
                }
                disabled={productCartQty >= product.stock}
              >
                Thêm vào giỏ
              </button>
            ) : product.stock > 0 && product.preOrder && authToken ? (
              <button
                onClick={() =>
                  dispatch(
                    addToCart({
                      ...product,
                      quantity: quantityCount,
                    })
                  )
                }
                disabled={productCartQty >= product.stock}
              >
                Đặt trước
              </button>
            ) : (
              <button disabled>Hết hàng</button>
            )}
          </div>
          <div className="pro-details-wishlist">
            <button
              className={isProductInWishlist ? "active" : ""}
              disabled={isProductInWishlist}
              title={
                isProductInWishlist
                  ? "Đã thêm vào yêu thích"
                  : "Thêm vào yêu thích"
              }
              onClick={handleWishlistClick}
            >
              <i className="pe-7s-like" />
            </button>
          </div>
          <div className="pro-details-compare">
            <button
              className={compareItem !== undefined ? "active" : ""}
              disabled={compareItem !== undefined}
              title={
                compareItem !== undefined
                  ? "Đã thêm vào so sánh"
                  : "Thêm vào so sánh"
              }
              onClick={() => dispatch(addToCompare(product))}
            >
              <i className="pe-7s-shuffle" />
            </button>
          </div>
        </div>
      {category && (
        <div className="pro-details-meta">
          <span>Danh mục:</span>
          <ul>
            <li>
              <Link>{category.categoryName}</Link>
            </li>
          </ul>
        </div>
      )}
      {brand && (
        <div className="pro-details-meta">
          <span>Thương hiệu:</span>
          <ul>
            <li>
              <Link>{brand.brandName}</Link>
            </li>
          </ul>
        </div>
      )}

  <div className="pro-details-meta">
  <h4>{product.stock >= 0 && product.preOrder && authToken ? `Số sản phẩm cho phép đặt trước: ${product.stock}` : `Số sản phẩm còn lại: ${product.stock}`}</h4>
        </div>
    </div>
  );
};

ProductDescriptionInfo.propTypes = {
  product: PropTypes.shape({}),
  discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.number,
  finalProductPrice: PropTypes.number,
  cartItems: PropTypes.array,
  wishlistItem: PropTypes.object,
  compareItem: PropTypes.array,
};

export default ProductDescriptionInfo;
