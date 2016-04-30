﻿module BABYLON {

    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    export class BoundingInfo2D {

        /**
         * The radius of the bounding circle, from the origin of the bounded object
         */
        public radius: number;

        /**
         * The extent of the bounding rectangle, from the orgini of the bounded object.
         * This is an absolute value in both X and Y of the vector which describe the right/top corner of the rectangle, you can easily reconstruct the whole rectangle by negating X &| Y.
         */
        public extent: Size;

        constructor() {
            this.extent = new Size(0, 0);
        }

        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        public clone(): BoundingInfo2D {
            let r = new BoundingInfo2D();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
        }

        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        public transform(matrix: Matrix): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
            return r;
        }

        /**
         * Compute the union of this BoundingInfo2D with a given one, return a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        public union(other: BoundingInfo2D): BoundingInfo2D {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        }

        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        public transformToRef(matrix: Matrix, result: BoundingInfo2D) {
            // Extract scale from matrix
            let xs = MathTools.Sign(matrix.m[0] * matrix.m[1] * matrix.m[2] * matrix.m[3]) < 0 ? -1 : 1;
            let ys = MathTools.Sign(matrix.m[4] * matrix.m[5] * matrix.m[6] * matrix.m[7]) < 0 ? -1 : 1;
            let scaleX = xs * Math.sqrt(matrix.m[0] * matrix.m[0] + matrix.m[1] * matrix.m[1] + matrix.m[2] * matrix.m[2]);
            let scaleY = ys * Math.sqrt(matrix.m[4] * matrix.m[4] + matrix.m[5] * matrix.m[5] + matrix.m[6] * matrix.m[6]);

            // Get translation
            let trans = matrix.getTranslation();
            let transLength = trans.length();

            if (transLength < Epsilon) {
                result.radius = this.radius * Math.max(scaleX, scaleY);
            } else {
                // Compute the radius vector by applying the transformation matrix manually
                let rx = (trans.x / transLength) * (transLength + this.radius) * scaleX;
                let ry = (trans.y / transLength) * (transLength + this.radius) * scaleY;

                // Store the vector length as the new radius
                result.radius = Math.sqrt(rx * rx + ry * ry);
            }

            // Construct a bounding box based on the extent values
            let p = new Array<Vector2>(4);
            p[0] = new Vector2(this.extent.width, this.extent.height);
            p[1] = new Vector2(this.extent.width, -this.extent.height);
            p[2] = new Vector2(-this.extent.width, -this.extent.height);
            p[3] = new Vector2(-this.extent.width, this.extent.height);

            // Transform the four points of the bounding box with the matrix
            for (let i = 0; i < 4; i++) {
                p[i] = Vector2.Transform(p[i], matrix);
            }

            // Take the first point as reference
            let maxW = Math.abs(p[0].x), maxH = Math.abs(p[0].y);

            // Parse the three others, compare them to the reference and keep the biggest
            for (let i = 1; i < 4; i++) {
                maxW = Math.max(Math.abs(p[i].x), maxW);
                maxH = Math.max(Math.abs(p[i].y), maxH);
            }

            // Store the new extent
            result.extent.width = maxW * scaleX;
            result.extent.height = maxH * scaleY;
        }

        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it everytime.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        public unionToRef(other: BoundingInfo2D, result: BoundingInfo2D) {
            result.radius = Math.max(this.radius, other.radius);
            result.extent.width = Math.max(this.extent.width, other.extent.width);
            result.extent.height = Math.max(this.extent.height, other.extent.height);
        }

    }
}